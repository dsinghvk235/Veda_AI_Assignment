"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "Upload both files",
    body: "Question paper on the left, one handwritten script on the right. Then Start Mapping.",
  },
  {
    title: "Watch the four beats",
    body: "We extract questions, find answer regions, map them (including out of order), then score with feedback.",
  },
  {
    title: "Click a question, trust the box",
    body: "Green is fully correct, orange is partial, red is incorrect. A dashed box was matched by wording (out of order). Grey dashed is extra writing. Unanswered questions show no box.",
  },
];

export function HelpDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/35" aria-label="Close help" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <p className="text-[11px] font-semibold tracking-wide text-orange uppercase">
          {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em]">{current.title}</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">{current.body}</p>
        <div className="mt-6 flex items-center justify-between">
          <button type="button" className="text-sm font-medium text-muted hover:text-zinc-800" onClick={onClose}>
            Close
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setStep((value) => value + 1)}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
              onClick={onClose}
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
