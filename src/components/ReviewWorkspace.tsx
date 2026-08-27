"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import {
  attachAnswer,
  detachAnswer,
  exportCsv,
  setFeedback,
  setScore,
} from "@/lib/review";
import { saveAnalysis } from "@/lib/storage";
import type { AnalysisResult } from "@/lib/types";
import { AnswerSheetViewer } from "./AnswerSheetViewer";
import { GradePanel } from "./GradePanel";
import { QuestionList } from "./QuestionList";

export function ReviewWorkspace({ result: initial }: { result: AnalysisResult }) {
  const [result, setResult] = useState<AnalysisResult>(() => ({
    ...initial,
    graded: initial.graded !== false,
    studentName: initial.studentName ?? null,
  }));
  const firstId =
    initial.items.find((item) => item.answer)?.question.id ?? initial.items[0]?.question.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(firstId);
  const [selectedUnmappedId, setSelectedUnmappedId] = useState<string | null>(null);
  const [pane, setPane] = useState<"questions" | "sheet">("sheet");

  const selected = useMemo(
    () => result.items.find((item) => item.question.id === selectedId) ?? null,
    [result.items, selectedId]
  );

  const answered = result.items.filter((item) => item.answer).length;
  const unanswered = result.items.length - answered;

  function commit(next: AnalysisResult) {
    setResult(next);
    saveAnalysis(next);
  }

  function selectQuestion(id: string) {
    setSelectedId(id);
    setSelectedUnmappedId(null);
    setPane("sheet");
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const index = result.items.findIndex((item) => item.question.id === selectedId);
      if (event.key === "j" || event.key === "J") {
        const next = result.items[Math.min(result.items.length - 1, index + 1)];
        if (next) selectQuestion(next.question.id);
      }
      if (event.key === "k" || event.key === "K") {
        const prev = result.items[Math.max(0, index - 1)];
        if (prev) selectQuestion(prev.question.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [result.items, selectedId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black">
          <ArrowLeft size={16} />
          New paper
        </Link>
        <div className="flex min-w-0 items-baseline gap-3">
          <p className="text-lg font-extrabold tracking-[-0.03em]">
            {result.graded !== false ? (
              <>
                {result.awardedMarks}
                <span className="text-sm font-semibold text-muted">/{result.totalMarks}</span>
              </>
            ) : (
              <span className="text-sm font-semibold">Mapped only</span>
            )}
          </p>
          <p className="truncate text-xs font-medium text-zinc-600">
            {answered} answered · {unanswered} missing
            {result.unmappedAnswers.length ? ` · ${result.unmappedAnswers.length} extra` : ""}
            {result.studentName ? ` · ${result.studentName}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportCsv(result)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {result.overallFeedback && (
        <p className="border-b border-line bg-[#faf9f7] px-4 py-2.5 text-[13px] leading-5 text-zinc-800 sm:px-5">
          {result.overallFeedback}
        </p>
      )}

      {result.unmappedAnswers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 sm:px-5">
          <span className="text-[11px] font-bold tracking-wide text-zinc-700 uppercase">Extra writing</span>
          {result.unmappedAnswers.map((answer, index) => (
            <button
              key={answer.id}
              type="button"
              onClick={() => {
                setSelectedUnmappedId(answer.id);
                setPane("sheet");
              }}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                selectedUnmappedId === answer.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
              }`}
            >
              Extra {index + 1}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-b border-line px-4 py-2 lg:hidden">
        <PaneTab active={pane === "questions"} onClick={() => setPane("questions")}>
          Questions
        </PaneTab>
        <PaneTab active={pane !== "questions"} onClick={() => setPane("sheet")}>
          Mapping
        </PaneTab>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(240px,32%)_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <section className={`min-h-0 ${pane === "questions" ? "block" : "hidden"} lg:block lg:border-r lg:border-line`}>
          <QuestionList
            items={result.items}
            selectedId={selectedId}
            onSelect={selectQuestion}
            graded={result.graded !== false}
          />
        </section>
        <section className={`min-h-0 ${pane === "sheet" ? "block" : "hidden"} min-h-[50vh] lg:block`}>
          <AnswerSheetViewer
            pages={result.answerPages}
            item={selected}
            unmapped={result.unmappedAnswers}
            selectedUnmappedId={selectedUnmappedId}
            onSelectUnmapped={setSelectedUnmappedId}
          />
        </section>
        <section className="hidden min-h-0 xl:block xl:border-l xl:border-line">
          <GradePanel
            item={selected}
            graded={result.graded !== false}
            unmapped={result.unmappedAnswers}
            onScore={(score) => selected && commit(setScore(result, selected.question.id, score))}
            onFeedback={(feedback) => selected && commit(setFeedback(result, selected.question.id, feedback))}
            onDetach={() => selected && commit(detachAnswer(result, selected.question.id))}
            onAttach={(answerId) => {
              if (!selected) return;
              const answer = result.unmappedAnswers.find((entry) => entry.id === answerId);
              if (answer) commit(attachAnswer(result, selected.question.id, answer));
            }}
          />
        </section>
      </div>
    </div>
  );
}

function PaneTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}
