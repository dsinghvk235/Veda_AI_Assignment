import type { AnalysisResult, ExtractedAnswer, MappingMethod, MappedItem, Verdict } from "./types";

export function verdictFromScore(score: number, maxMarks: number, hasAnswer: boolean): Verdict {
  if (!hasAnswer) return "unanswered";
  if (score >= maxMarks) return "correct";
  if (score > 0) return "partial";
  return "incorrect";
}

export function recount(result: AnalysisResult): AnalysisResult {
  const awardedMarks = result.items.reduce((sum, item) => sum + item.score, 0);
  const totalMarks = result.items.reduce((sum, item) => sum + item.question.maxMarks, 0);
  return { ...result, awardedMarks, totalMarks };
}

export function attachAnswer(
  result: AnalysisResult,
  questionId: string,
  answer: ExtractedAnswer
): AnalysisResult {
  const previous = result.items.find((item) => item.question.id === questionId);
  const displaced = previous?.answer && previous.answer.id !== answer.id ? previous.answer : null;
  const unmapped = result.unmappedAnswers
    .filter((entry) => entry.id !== answer.id)
    .concat(displaced ? [displaced] : []);

  const items = result.items.map((item) => {
    if (item.answer?.id === answer.id && item.question.id !== questionId) {
      return blankItem(item, null, "none");
    }
    if (item.question.id !== questionId) return item;
    return {
      ...item,
      answer,
      method: "manual" as MappingMethod,
      score: item.score,
      verdict: verdictFromScore(item.score, item.question.maxMarks, true),
      feedback: item.feedback || "Assigned by you.",
    };
  });

  return recount({ ...result, items, unmappedAnswers: unmapped });
}

export function detachAnswer(result: AnalysisResult, questionId: string): AnalysisResult {
  const current = result.items.find((item) => item.question.id === questionId)?.answer;
  const items = result.items.map((item) =>
    item.question.id === questionId ? blankItem(item, null, "none") : item
  );
  const unmapped = current
    ? [...result.unmappedAnswers.filter((entry) => entry.id !== current.id), current]
    : result.unmappedAnswers;
  return recount({ ...result, items, unmappedAnswers: unmapped });
}

export function setScore(result: AnalysisResult, questionId: string, score: number): AnalysisResult {
  const items = result.items.map((item) => {
    if (item.question.id !== questionId) return item;
    const next = Math.min(item.question.maxMarks, Math.max(0, score));
    return {
      ...item,
      score: next,
      verdict: verdictFromScore(next, item.question.maxMarks, Boolean(item.answer)),
    };
  });
  return recount({ ...result, items });
}

export function setFeedback(result: AnalysisResult, questionId: string, feedback: string): AnalysisResult {
  return {
    ...result,
    items: result.items.map((item) =>
      item.question.id === questionId ? { ...item, feedback } : item
    ),
  };
}

export function methodLabel(method: MappingMethod) {
  if (method === "number") return "Matched by question number";
  if (method === "semantic") return "Matched from wording (out of order)";
  if (method === "manual") return "Assigned by you";
  return "No mapping";
}

export function exportCsv(result: AnalysisResult) {
  const rows = [
    ["Number", "Question", "Max", "Score", "Verdict", "Match", "Student answer", "Feedback"],
    ...result.items.map((item) => [
      item.question.number,
      item.question.text,
      String(item.question.maxMarks),
      String(item.score),
      item.verdict,
      item.method,
      item.answer?.text ?? "",
      item.feedback,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.questionFileName.replace(/\.[^.]+$/, "")}-mapping.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function blankItem(item: MappedItem, answer: ExtractedAnswer | null, method: MappingMethod): MappedItem {
  return {
    ...item,
    answer,
    method,
    score: 0,
    verdict: "unanswered",
    feedback: "No matching answer was found on the sheet.",
  };
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
