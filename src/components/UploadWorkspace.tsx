"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { analyzeDocuments } from "@/lib/analyze-client";
import { buildSampleResult } from "@/lib/demo";
import {
  isAllowedFile,
  MAX_ANSWER_PAGES,
  MAX_FILE_BYTES,
  MAX_QUESTION_PAGES,
  pageThumbSrc,
  rasterizeFile,
} from "@/lib/rasterize";
import { saveAnalysis } from "@/lib/storage";
import type { PipelineStage, ProgressStats } from "@/lib/types";
import { ExtractingScreen } from "./ExtractingScreen";
import { UploadCard, type SelectedFile } from "./UploadCard";

export function UploadWorkspace() {
  const router = useRouter();
  const [question, setQuestion] = useState<SelectedFile | null>(null);
  const [answer, setAnswer] = useState<SelectedFile | null>(null);
  const [studentName, setStudentName] = useState("");
  const [skipGrading, setSkipGrading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Preparing files…");
  const [progress, setProgress] = useState(6);
  const [stage, setStage] = useState<PipelineStage>("rasterize");
  const [stats, setStats] = useState<ProgressStats | undefined>();
  const [error, setError] = useState<string | null>(null);

  const bothReady =
    Boolean(question?.pages?.length && answer?.pages?.length) &&
    !question?.previewing &&
    !answer?.previewing &&
    !busy;

  async function pick(kind: "question" | "answer", file: File) {
    setError(null);
    if (!isAllowedFile(file)) {
      setError("Please upload a PDF or an image (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Each file must be under 20 MB.");
      return;
    }
    const selected: SelectedFile = { file, previewing: true };
    if (kind === "question") setQuestion(selected);
    else setAnswer(selected);

    try {
      const pages = await rasterizeFile(file, kind);
      const next = { file, pages };
      if (kind === "question") setQuestion(next);
      else setAnswer(next);
    } catch (cause) {
      const failed = {
        file,
        error: cause instanceof Error ? cause.message : "Could not read this file.",
      };
      if (kind === "question") setQuestion(failed);
      else setAnswer(failed);
    }
  }

  async function startMapping() {
    if (!question?.pages?.length || !answer?.pages?.length) return;
    setBusy(true);
    setError(null);
    setProgress(10);
    setStage("questions");
    setStats(undefined);
    setMessage("Sending pages to the model…");

    try {
      const result = await analyzeDocuments(
        {
          questionFileName: question.file.name,
          answerFileName: answer.file.name,
          questionPages: question.pages,
          answerPages: answer.pages,
          skipGrading,
          studentName: studentName.trim() || null,
        },
        (event) => {
          setMessage(event.message);
          setProgress(event.progress);
          setStage(event.stage);
          if (event.stats) setStats(event.stats);
        }
      );

      const thumbnail = answer.pages[0] ? await pageThumbSrc(answer.pages[0]) : null;
      saveAnalysis(result, thumbnail);
      router.push("/review");
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    }
  }

  function openSample() {
    const sample = buildSampleResult();
    void pageThumbSrc(sample.answerPages[0]).then((thumbnail) => {
      saveAnalysis(sample, thumbnail);
      router.push("/review");
    });
  }

  if (busy) {
    return <ExtractingScreen message={message} progress={progress} stage={stage} stats={stats} />;
  }

  const qPages = question?.pages?.length ?? 0;
  const aPages = answer?.pages?.length ?? 0;
  const buttonLabel = bothReady
    ? `Start mapping (${qPages} + ${aPages} page${aPages + qPages === 1 ? "" : "s"})`
    : question || answer
      ? "Upload both files to continue"
      : "Start Mapping";

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col items-center px-4 py-8 sm:px-8 sm:py-12 lg:py-16">
      <PaperMark />
      <h1 className="mt-6 max-w-[22ch] text-center text-[28px] leading-[1.15] font-extrabold tracking-[-0.03em] sm:mt-8 sm:text-[36px] lg:text-[40px]">
        Upload <span className="text-orange">Question Paper & Answer Sheets</span>
      </h1>
      <p className="mt-3 text-center text-sm text-muted">Two files. Then we map every answer to its question.</p>

      <div className="mt-8 grid w-full gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2">
        <UploadCard
          title="Question paper"
          hint={`PDF or image · up to ${MAX_QUESTION_PAGES} pages`}
          value={question}
          onSelect={(file) => pick("question", file)}
          onClear={() => setQuestion(null)}
        />
        <UploadCard
          title="Answer sheet"
          hint={`PDF or image · one script · up to ${MAX_ANSWER_PAGES} pages`}
          value={answer}
          onSelect={(file) => pick("answer", file)}
          onClear={() => setAnswer(null)}
        />
      </div>

      <label className="mt-6 flex w-full max-w-sm flex-col gap-1.5 text-left">
        <span className="text-xs font-medium text-muted">Student name (optional)</span>
        <input
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          placeholder="e.g. Aanya Sharma"
          className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none ring-orange/30 transition focus:ring-2"
        />
      </label>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={skipGrading}
          onChange={(event) => setSkipGrading(event.target.checked)}
          className="accent-[#ff5c33]"
        />
        Map only — skip scoring
      </label>

      <button
        type="button"
        disabled={!bothReady}
        onClick={startMapping}
        className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-zinc-950 px-7 py-3 text-sm font-semibold text-white transition duration-200 enabled:hover:bg-black disabled:cursor-not-allowed disabled:bg-[#d9d9d9]"
      >
        {buttonLabel}
        <ArrowRight size={16} />
      </button>
      <p className="mt-3 max-w-sm text-center text-xs leading-5 text-muted">
        {bothReady
          ? "You’ll land on a split view: questions on the left, highlights on the sheet."
          : "Once both files are ready, mapping can start."}
      </p>

      {error && (
        <div className="mt-6 w-full max-w-lg rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
            {bothReady && (
              <button type="button" className="underline" onClick={startMapping}>
                Try again
              </button>
            )}
            <button type="button" className="underline" onClick={openSample}>
              Preview sample instead
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={openSample}
        className="mt-8 text-sm font-medium text-orange underline-offset-2 hover:underline"
      >
        See a graded example
      </button>
      <p className="mt-1 max-w-xs text-center text-[11px] leading-4 text-muted">
        Opens the split review with unanswered, out-of-order, and unmapped writing — no API call.
      </p>
    </div>
  );
}

function PaperMark() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f1ee] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] sm:h-[72px] sm:w-[72px]">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 3.5h7.2L19 8.2V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5H7Z"
          stroke="#111"
          strokeWidth="1.5"
        />
        <path d="M14 3.6V8h4.3" stroke="#111" strokeWidth="1.5" />
        <path d="M8.5 12h7M8.5 15.5h5" stroke="#FF5C33" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
