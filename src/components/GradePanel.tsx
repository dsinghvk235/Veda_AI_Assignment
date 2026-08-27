"use client";

import { Minus, Plus } from "lucide-react";
import { methodLabel } from "@/lib/review";
import type { ExtractedAnswer, MappedItem } from "@/lib/types";

export function GradePanel({
  item,
  graded,
  unmapped,
  onScore,
  onFeedback,
  onDetach,
  onAttach,
}: {
  item: MappedItem | null;
  graded: boolean;
  unmapped: ExtractedAnswer[];
  onScore: (score: number) => void;
  onFeedback: (feedback: string) => void;
  onDetach: () => void;
  onAttach: (answerId: string) => void;
}) {
  if (!item) {
    return (
      <div className="flex h-full items-center justify-center px-5 text-center text-sm text-muted">
        Select a question to inspect it.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-4 py-4">
      <p className="text-[11px] font-bold tracking-[0.06em] text-zinc-700 uppercase">Question {item.question.number}</p>
      <p className="mt-1 text-[15px] leading-6 font-semibold tracking-[-0.02em] text-zinc-950">{item.question.text}</p>

      <div className="mt-4 rounded-2xl bg-[#f4f1ee] px-3.5 py-3">
        <p className="text-[11px] font-bold tracking-[0.06em] text-zinc-700 uppercase">Student</p>
        <p className="mt-1.5 text-sm leading-6 text-zinc-900">{item.answer?.text ?? "No writing found for this question."}</p>
      </div>

      {graded ? (
        <div className="mt-4">
          <p className="text-[11px] font-bold tracking-[0.06em] text-zinc-700 uppercase">Marks</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:bg-zinc-50"
              onClick={() => onScore(item.score - 1)}
              aria-label="Decrease marks"
            >
              <Minus size={14} />
            </button>
            <p className="min-w-[4.5rem] text-center text-sm font-bold">
              {item.score}
              <span className="font-medium text-muted"> / {item.question.maxMarks}</span>
            </p>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line hover:bg-zinc-50"
              onClick={() => onScore(item.score + 1)}
              aria-label="Increase marks"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted">Scoring was skipped for this run.</p>
      )}

      <label className="mt-4 block">
        <span className="text-[11px] font-bold tracking-[0.06em] text-zinc-700 uppercase">Feedback</span>
        <textarea
          value={item.feedback}
          onChange={(event) => onFeedback(event.target.value)}
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-6 text-zinc-900 outline-none ring-orange/25 transition focus:ring-2"
        />
      </label>

      <p className="mt-3 text-[12px] font-semibold text-zinc-700">{methodLabel(item.method)}</p>

      <div className="mt-4 space-y-2 border-t border-line pt-4">
        {item.answer ? (
          <button
            type="button"
            onClick={onDetach}
            className="w-full rounded-xl border border-line px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Detach from this question
          </button>
        ) : unmapped.length > 0 ? (
          <label className="block text-xs">
            <span className="font-semibold text-zinc-700">Attach extra writing</span>
            <select
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-2 py-2 text-xs outline-none"
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
                  Extra {index + 1}: {(answer.text || "Unlabeled writing").slice(0, 48)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-xs text-muted">Nothing left to attach.</p>
        )}
      </div>
    </div>
  );
}
