"use client";

import type { ExtractedAnswer, MappedItem, Verdict } from "@/lib/types";
import { methodLabel } from "@/lib/review";

const verdictDot: Record<Verdict, string> = {
  correct: "bg-emerald-500",
  partial: "bg-amber-500",
  incorrect: "bg-red-500",
  unanswered: "bg-zinc-300",
};

export type QuestionFilter = "all" | "answered" | "unanswered";

export function QuestionList({
  items,
  selectedId,
  onSelect,
  graded,
  filter,
  onFilter,
  unmapped,
  onDetach,
  onAttach,
}: {
  items: MappedItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  graded: boolean;
  filter: QuestionFilter;
  onFilter: (filter: QuestionFilter) => void;
  unmapped: ExtractedAnswer[];
  onDetach: () => void;
  onAttach: (answerId: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-[15px] font-bold tracking-[-0.02em]">Questions</h2>
        <div className="mt-2.5 flex gap-1">
          <FilterChip active={filter === "all"} onClick={() => onFilter("all")}>
            All
          </FilterChip>
          <FilterChip active={filter === "answered"} onClick={() => onFilter("answered")}>
            Answered
          </FilterChip>
          <FilterChip active={filter === "unanswered"} onClick={() => onFilter("unanswered")}>
            Unanswered
          </FilterChip>
        </div>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const selected = item.question.id === selectedId;
          return (
            <li
              key={item.question.id}
              className={`mb-0.5 ${selected ? "rounded-2xl bg-[#fff7f4] ring-1 ring-orange/30" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.question.id)}
                className={`flex w-full items-start gap-2.5 rounded-2xl px-3 py-2.5 text-left transition duration-150 ${
                  selected ? "" : "hover:bg-zinc-50"
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
                          ? "Unanswered"
                          : `${item.score}/${item.question.maxMarks}`
                        : item.answer
                          ? "Mapped"
                          : "Unanswered"}
                    </span>
                  </span>
                  <span className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-zinc-900">
                    {item.question.text}
                  </span>
                </span>
              </button>
              {selected && (
                <div className="px-3 pb-3">
                  <p className="text-[10px] font-bold tracking-[0.06em] text-zinc-500 uppercase">Student answer</p>
                  <p className="mt-1 text-[13px] leading-5 text-zinc-900">
                    {item.answer?.text ?? "No writing found for this question."}
                  </p>
                  {item.feedback && (
                    <>
                      <p className="mt-3 text-[10px] font-bold tracking-[0.06em] text-zinc-500 uppercase">Feedback</p>
                      <p className="mt-1 text-[13px] leading-5 text-zinc-800">{item.feedback}</p>
                    </>
                  )}
                  <p className="mt-2 text-[11px] font-medium text-zinc-500">{methodLabel(item.method)}</p>
                  {item.answer ? (
                    <button
                      type="button"
                      onClick={onDetach}
                      className="mt-3 text-[11px] font-semibold text-zinc-500 hover:text-zinc-800"
                    >
                      Detach answer
                    </button>
                  ) : unmapped.length > 0 ? (
                    <label className="mt-3 block text-[11px] font-semibold text-zinc-600">
                      Attach extra writing
                      <select
                        className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] font-medium outline-none"
                        defaultValue=""
                        onChange={(event) => {
                          if (event.target.value) onAttach(event.target.value);
                          event.target.value = "";
                        }}
                      >
                        <option value="" disabled>
                          Choose a region…
                        </option>
                        {unmapped.map((answer, index) => (
                          <option key={answer.id} value={answer.id}>
                            Extra {index + 1}: {(answer.text || "Unlabeled").slice(0, 40)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FilterChip({
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
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
