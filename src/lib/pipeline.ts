import { generateJson } from "./gemini";
import { numbersEqual, normalizeQuestionNumber } from "./normalize";
import {
  answerExtractSchema,
  gradeSchema,
  questionExtractSchema,
  semanticMapSchema,
} from "./schemas";
import type {
  AnalysisResult,
  ExtractedAnswer,
  MappedItem,
  PageImage,
  PipelineStage,
  ProgressStats,
  Question,
  Region,
} from "./types";

export type StageCallback = (
  stage: PipelineStage,
  message: string,
  progress: number,
  stats?: ProgressStats
) => void;

function clampRegion(region: Region, pageCount: number): Region | null {
  const page = Math.min(Math.max(Math.round(region.page || 1), 1), pageCount);
  const ymin = clamp1000(region.ymin);
  const xmin = clamp1000(region.xmin);
  const ymax = clamp1000(region.ymax);
  const xmax = clamp1000(region.xmax);
  if (ymax <= ymin || xmax <= xmin) return null;
  return { page, ymin, xmin, ymax, xmax };
}

function clamp1000(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1000, Math.max(0, value));
}

function uid() {
  return crypto.randomUUID();
}

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

const PAGE_BATCH = 1;

export async function runPipeline(input: {
  questionFileName: string;
  answerFileName: string;
  questionPages: PageImage[];
  answerPages: PageImage[];
  skipGrading?: boolean;
  studentName?: string | null;
  onStage?: StageCallback;
}): Promise<AnalysisResult> {
  const notify = input.onStage ?? (() => undefined);

  notify("questions", "Reading the question paper…", 18);
  const { questions, subject } = await extractQuestions(input.questionPages);
  notify("questions", `${questions.length} question${questions.length === 1 ? "" : "s"} found.`, 32, {
    questions: questions.length,
  });

  notify("answers", "Reading the handwritten answer sheet…", 42, { questions: questions.length });
  const answers = await extractAnswers(input.answerPages);
  notify("answers", `${answers.length} answer region${answers.length === 1 ? "" : "s"} found.`, 58, {
    questions: questions.length,
    answers: answers.length,
  });

  notify("mapping", "Matching answers to questions…", 66, {
    questions: questions.length,
    answers: answers.length,
  });
  const { items, unmappedAnswers } = await mapAnswers(questions, answers);
  const mapped = items.filter((item) => item.answer).length;
  notify(
    "mapping",
    `${mapped} matched · ${items.length - mapped} unanswered · ${unmappedAnswers.length} extra.`,
    78,
    {
      questions: questions.length,
      answers: answers.length,
      mapped,
      unanswered: items.length - mapped,
      extra: unmappedAnswers.length,
    }
  );

  let gradedItems = items;
  let overallFeedback = "";
  if (input.skipGrading) {
    notify("grading", "Skipping scoring — mapping only.", 92, {
      questions: questions.length,
      mapped,
      unanswered: items.length - mapped,
      extra: unmappedAnswers.length,
    });
    gradedItems = items.map((item) =>
      item.answer ? { ...item, score: 0, feedback: item.feedback || "Not scored." } : item
    );
  } else {
    notify("grading", "Scoring answers and writing feedback…", 86, {
      questions: questions.length,
      mapped,
    });
    const graded = await gradeItems(items);
    gradedItems = graded.items;
    overallFeedback = graded.overallFeedback;
  }

  const totalMarks = gradedItems.reduce((sum, item) => sum + item.question.maxMarks, 0);
  const awardedMarks = gradedItems.reduce((sum, item) => sum + item.score, 0);

  notify("done", "Mapping complete.", 100, {
    questions: questions.length,
    answers: answers.length,
    mapped,
    unanswered: items.length - mapped,
    extra: unmappedAnswers.length,
  });

  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    questionFileName: input.questionFileName,
    answerFileName: input.answerFileName,
    studentName: input.studentName?.trim() || null,
    subject,
    totalMarks,
    awardedMarks,
    overallFeedback,
    graded: !input.skipGrading,
    items: gradedItems,
    unmappedAnswers,
    answerPages: input.answerPages.map((page) => ({ ...page })),
    questionPages: input.questionPages.map((page) => ({ ...page, data: "" })),
  };
}

async function extractQuestions(pages: PageImage[]): Promise<{ questions: Question[]; subject: string | null }> {
  const collected: Array<{
    number: string;
    text: string;
    maxMarks?: number;
    type?: Question["type"];
    page?: number;
  }> = [];
  let subject: string | null = null;

  for (const batch of chunk(pages, PAGE_BATCH)) {
    const pageLabel = batch.map((page) => page.page).join(", ");
    const result = await generateJson<{
      subject?: string;
      questions: Array<{
        number: string;
        text: string;
        maxMarks?: number;
        type?: Question["type"];
        page?: number;
      }>;
    }>({
      prompt: `You are extracting a school/college question paper.

Rules:
- Extract EVERY question in printed order.
- Preserve original numbering exactly, including sub-parts. "11 (a)" and "11 (b)" are TWO separate questions with numbers "11(a)" and "11(b)".
- Ignore instructions, headers, watermarks, and marks-only legends unless they belong to a question.
- If max marks appear next to a question, use them. Otherwise estimate: MCQ 1, short 2-3, long 5.
- Do not invent questions that are not on the paper.
- These images are pages ${pageLabel} of the paper. page must be the actual 1-indexed page number.`,
      images: batch.map((page) => ({ mimeType: page.mimeType, data: page.data })),
      schema: questionExtractSchema,
    });
    if (!subject && result.subject?.trim()) subject = result.subject.trim();
    collected.push(...(result.questions ?? []));
  }

  return {
    subject,
    questions: collected
      .filter((question) => question.text?.trim())
      .map((question, index) => ({
        id: `q-${index + 1}`,
        number: normalizeQuestionNumber(question.number) || String(index + 1),
        text: question.text.trim(),
        maxMarks: Number.isFinite(question.maxMarks) ? Math.max(1, Number(question.maxMarks)) : 2,
        type: question.type ?? "other",
        page: question.page,
      })),
  };
}

async function extractAnswers(pages: PageImage[]): Promise<ExtractedAnswer[]> {
  const collected: Array<{
    claimedNumber?: string;
    text: string;
    confidence?: number;
    regions: Region[];
  }> = [];

  for (const batch of chunk(pages, PAGE_BATCH)) {
    const pageLabel = batch.map((page) => page.page).join(", ");
    const result = await generateJson<{
      answers: Array<{
        claimedNumber?: string;
        text: string;
        confidence?: number;
        regions: Region[];
      }>;
    }>({
      prompt: `You are reading a student's handwritten answer sheet.

Rules:
- Transcribe each distinct answer. Students may answer OUT OF ORDER.
- If the student wrote a question number, put it in claimedNumber (keep sub-parts like 11(a)).
- If there is writing that does not correspond to any numbered question, still extract it with claimedNumber empty.
- Skip blank space and doodles.
- For EVERY answer, return the tight bounding box(es) of that answer on the original page image.
- Coordinates MUST use the 0-1000 normalized system: ymin, xmin, ymax, xmax.
- These images are pages ${pageLabel} of the sheet. page must be the actual 1-indexed page number.
- An answer that continues across pages must have one region per page it occupies.
- Do not merge two different questions into one answer.`,
      images: batch.map((page) => ({ mimeType: page.mimeType, data: page.data })),
      schema: answerExtractSchema,
    });
    collected.push(...(result.answers ?? []));
  }

  return collected
    .map((answer, index) => {
      const regions = (answer.regions ?? [])
        .map((region) => clampRegion(region, pages.length))
        .filter((region): region is Region => Boolean(region));
      return {
        id: `a-${index + 1}`,
        claimedNumber: normalizeQuestionNumber(answer.claimedNumber) || null,
        text: (answer.text ?? "").trim(),
        confidence: Math.min(1, Math.max(0, answer.confidence ?? 0.6)),
        regions,
      };
    })
    .filter((answer) => answer.text || answer.regions.length);
}

async function mapAnswers(questions: Question[], answers: ExtractedAnswer[]) {
  const used = new Set<string>();
  const items: MappedItem[] = questions.map((question) => {
    const match = answers.find(
      (answer) => !used.has(answer.id) && numbersEqual(answer.claimedNumber, question.number)
    );
    if (match) {
      used.add(match.id);
      return blankMapped(question, match, "number");
    }
    return blankMapped(question, null, "none");
  });

  const leftover = answers.filter((answer) => !used.has(answer.id));
  const unanswered = items.filter((item) => !item.answer);
  if (leftover.length && unanswered.length) {
    const semantic = await generateJson<{
      pairs: Array<{ questionNumber: string; answerIndex: number }>;
    }>({
      prompt: `Match leftover handwritten answers to unanswered questions using meaning, not only numbers.

Unanswered questions:
${unanswered.map((item) => `${item.question.number}: ${item.question.text}`).join("\n")}

Leftover answers (0-indexed):
${leftover.map((answer, index) => `${index}: claimed=${answer.claimedNumber ?? "none"} :: ${answer.text.slice(0, 400)}`).join("\n")}

Only return pairs you are confident about. Never assign one answer to two questions.`,
      images: [],
      schema: semanticMapSchema,
      temperature: 0,
    });

    for (const pair of semantic.pairs ?? []) {
      const item = items.find(
        (entry) => !entry.answer && numbersEqual(entry.question.number, pair.questionNumber)
      );
      const answer = leftover[pair.answerIndex];
      if (!item || !answer || used.has(answer.id)) continue;
      used.add(answer.id);
      item.answer = answer;
      item.method = "semantic";
    }
  }

  return {
    items,
    unmappedAnswers: answers.filter((answer) => !used.has(answer.id)),
  };
}

function blankMapped(
  question: Question,
  answer: ExtractedAnswer | null,
  method: MappedItem["method"]
): MappedItem {
  return {
    question,
    answer,
    method,
    score: 0,
    verdict: answer ? "incorrect" : "unanswered",
    feedback: answer ? "" : "No matching answer was found on the sheet.",
  };
}

async function gradeItems(items: MappedItem[]): Promise<{ items: MappedItem[]; overallFeedback: string }> {
  if (!items.length) {
    return { items, overallFeedback: "No questions were extracted." };
  }

  const result = await generateJson<{
    overallFeedback: string;
    items: Array<{ number: string; score: number; verdict: MappedItem["verdict"]; feedback: string }>;
  }>({
    prompt: `Grade each mapped student answer against the question. Be a fair school teacher.

For unanswered items, score 0 and verdict unanswered.
Score cannot exceed max marks. Prefer partial credit over all-or-nothing for descriptive answers.

${items
  .map(
    (item) =>
      `Q ${item.question.number} [${item.question.maxMarks} marks] ${item.question.text}\nStudent: ${
        item.answer?.text ?? "(unanswered)"
      }`
  )
  .join("\n\n")}`,
    images: [],
    schema: gradeSchema,
    temperature: 0.2,
  });

  const byNumber = new Map(result.items.map((item) => [normalizeQuestionNumber(item.number), item]));

  return {
    overallFeedback: result.overallFeedback,
    items: items.map((item) => {
      const grade = byNumber.get(normalizeQuestionNumber(item.question.number));
      if (!item.answer) {
        return {
          ...item,
          score: 0,
          verdict: "unanswered" as const,
          feedback: grade?.feedback || item.feedback,
        };
      }
      const score = Math.min(item.question.maxMarks, Math.max(0, grade?.score ?? 0));
      return {
        ...item,
        score,
        verdict:
          grade?.verdict ??
          (score === item.question.maxMarks ? "correct" : score > 0 ? "partial" : "incorrect"),
        feedback: grade?.feedback ?? "Could not generate feedback for this answer.",
      };
    }),
  };
}
