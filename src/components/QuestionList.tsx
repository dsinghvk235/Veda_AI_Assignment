"use client";

import type { MappedItem, Verdict } from "@/lib/types";

const verdictDot: Record<Verdict, string> = {
  correct: "bg-emerald-500",
  partial: "bg-amber-500",
  incorrect: "bg-red-500",
  unanswered: "bg-zinc-300",
};

export function QuestionList({
  items,
  selectedId,
  onSelect,
  graded,
}: {
  items: MappedItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  graded: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-[15px] font-bold tracking-[-0.02em]">Questions</h2>
        <p className="mt-0.5 text-xs font-medium text-zinc-600">J / K to move · click to highlight</p>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const selected = item.question.id === selectedId;
          return (
            <li key={item.question.id}>
              <button
                type="button"
                onClick={() => onSelect(item.question.id)}
                className={`flex w-full items-start gap-2.5 rounded-2xl px-3 py-2.5 text-left transition duration-150 ${
                  selected
                    ? "bg-[linear-gradient(180deg,#fff7f4,#fff)] shadow-[0_8px_20px_rgba(255,92,51,0.08)] ring-1 ring-orange/25"
                    : "hover:bg-zinc-50"
                }`}
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    graded
                      ? verdictDot[item.verdict]
                      : item.answer
                        ? "bg-orange"
                        : "bg-zinc-300"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] font-semibold text-orange">Q{item.question.number}</span>
                    <span className="shrink-0 text-[12px] font-bold text-zinc-800">
                      {graded
                        ? item.verdict === "unanswered"
                          ? "—"
                          : `${item.score}/${item.question.maxMarks}`
                        : item.answer
                          ? "Mapped"
                          : "—"}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-zinc-900">
                    {item.question.text}
                  </span>
                  {selected && (
                    <span className="mt-2 block rounded-xl bg-[#fff4ef] px-2.5 py-2 text-[13px] leading-5 font-medium text-zinc-900">
                      {item.feedback || "No feedback for this question."}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
