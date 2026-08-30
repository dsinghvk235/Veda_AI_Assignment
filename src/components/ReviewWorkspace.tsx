"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download } from "lucide-react";
import { attachAnswer, detachAnswer, exportCsv } from "@/lib/review";
import { saveAnalysis } from "@/lib/storage";
import type { AnalysisResult, Verdict } from "@/lib/types";
import { AnswerSheetViewer } from "./AnswerSheetViewer";
import { QuestionList, type QuestionFilter } from "./QuestionList";

export function ReviewWorkspace({ result: initial }: { result: AnalysisResult }) {
  const [result, setResult] = useState<AnalysisResult>(() => ({
    ...initial,
    graded: initial.graded !== false,
    studentName: initial.studentName ?? null,
  }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUnmappedId, setSelectedUnmappedId] = useState<string | null>(null);
  const [pane, setPane] = useState<"questions" | "sheet">("sheet");
  const [filter, setFilter] = useState<QuestionFilter>("all");

  const selected = useMemo(
    () => result.items.find((item) => item.question.id === selectedId) ?? null,
    [result.items, selectedId]
  );

  const visibleItems = useMemo(() => {
    if (filter === "answered") return result.items.filter((item) => item.answer);
    if (filter === "unanswered") return result.items.filter((item) => !item.answer);
    return result.items;
  }, [filter, result.items]);

  const answered = result.items.filter((item) => item.answer).length;
  const unanswered = result.items.length - answered;
  const verdictCounts = useMemo(() => countVerdicts(result.items), [result.items]);

  function commit(next: AnalysisResult) {
    setResult(next);
    saveAnalysis(next);
  }

  function selectQuestion(id: string) {
    setSelectedId(id);
    setSelectedUnmappedId(null);
    setPane("sheet");
  }

  function changeFilter(next: QuestionFilter) {
    setFilter(next);
    const pool =
      next === "answered"
        ? result.items.filter((item) => item.answer)
        : next === "unanswered"
          ? result.items.filter((item) => !item.answer)
          : result.items;
    if (selectedId && !pool.some((item) => item.question.id === selectedId)) {
      setSelectedId(null);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      const index = visibleItems.findIndex((item) => item.question.id === selectedId);
      if (event.key === "j" || event.key === "J") {
        if (index < 0) {
          if (visibleItems[0]) selectQuestion(visibleItems[0].question.id);
          return;
        }
        const next = visibleItems[Math.min(visibleItems.length - 1, index + 1)];
        if (next) selectQuestion(next.question.id);
      }
      if (event.key === "k" || event.key === "K") {
        if (index < 0) {
          if (visibleItems[0]) selectQuestion(visibleItems[0].question.id);
          return;
        }
        const prev = visibleItems[Math.max(0, index - 1)];
        if (prev) selectQuestion(prev.question.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visibleItems, selectedId]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-black">
          <ArrowLeft size={16} />
          New paper
        </Link>
        <div className="min-w-0 text-center">
          {result.graded !== false ? (
            <p className="text-lg font-extrabold tracking-[-0.03em]">
              {result.awardedMarks}
              <span className="text-sm font-semibold text-muted">/{result.totalMarks}</span>
            </p>
          ) : (
            <p className="text-sm font-semibold">Mapped only</p>
          )}
          <p className="truncate text-[11px] font-medium text-zinc-600">
            {answered} answered · {unanswered} unanswered
            {result.unmappedAnswers.length ? ` · ${result.unmappedAnswers.length} extra` : ""}
          </p>
          {result.graded !== false && (
            <p className="truncate text-[11px] text-zinc-500">
              {verdictCounts.correct} correct · {verdictCounts.partial} partial · {verdictCounts.incorrect}{" "}
              incorrect · {verdictCounts.unanswered} unanswered
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => exportCsv(result)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50"
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {result.overallFeedback && (
        <p className="border-b border-line bg-[#faf9f7] px-4 py-2 text-[13px] leading-5 text-zinc-800 sm:px-5">
          {result.overallFeedback}
        </p>
      )}

      {result.unmappedAnswers.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 sm:px-5">
          <span className="text-[11px] font-bold tracking-wide text-zinc-500 uppercase">Extra writing</span>
          {result.unmappedAnswers.map((answer, index) => (
            <button
              key={answer.id}
              type="button"
              onClick={() => {
                setSelectedUnmappedId(answer.id);
                setSelectedId(null);
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
        <PaneTab active={pane === "sheet"} onClick={() => setPane("sheet")}>
          Answer sheet
        </PaneTab>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(280px,36%)_minmax(0,1fr)]">
        <section className={`min-h-0 ${pane === "questions" ? "block" : "hidden"} lg:block lg:border-r lg:border-line`}>
          <QuestionList
            items={visibleItems}
            selectedId={selectedId}
            onSelect={selectQuestion}
            graded={result.graded !== false}
            filter={filter}
            onFilter={changeFilter}
            unmapped={result.unmappedAnswers}
            onDetach={() => selected && commit(detachAnswer(result, selected.question.id))}
            onAttach={(answerId) => {
              if (!selected) return;
              const answer = result.unmappedAnswers.find((entry) => entry.id === answerId);
              if (answer) commit(attachAnswer(result, selected.question.id, answer));
            }}
          />
        </section>
        <section className={`min-h-0 ${pane === "sheet" ? "block" : "hidden"} min-h-[50vh] lg:block`}>
          <AnswerSheetViewer
            pages={result.answerPages}
            item={selected}
            unmapped={result.unmappedAnswers}
            selectedUnmappedId={selectedUnmappedId}
            onSelectUnmapped={(id) => {
              setSelectedUnmappedId(id);
              setSelectedId(null);
            }}
          />
        </section>
      </div>
    </div>
  );
}

function countVerdicts(items: AnalysisResult["items"]) {
  const counts: Record<Verdict, number> = { correct: 0, partial: 0, incorrect: 0, unanswered: 0 };
  for (const item of items) counts[item.verdict] += 1;
  return counts;
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
