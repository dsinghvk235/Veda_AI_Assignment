import type { PipelineStage, ProgressStats } from "@/lib/types";

const STEPS: Array<{ id: PipelineStage; label: string; hint: string }> = [
  { id: "questions", label: "Question paper", hint: "Finding every question" },
  { id: "answers", label: "Answer sheet", hint: "Locating handwritten regions" },
  { id: "mapping", label: "Mapping", hint: "Matching answers, even out of order" },
  { id: "grading", label: "Scoring", hint: "Marks and feedback" },
];

function stepIndex(stage: PipelineStage) {
  const index = STEPS.findIndex((step) => step.id === stage);
  if (stage === "done") return STEPS.length;
  if (stage === "rasterize") return 0;
  return Math.max(0, index);
}

export function ExtractingScreen({
  message,
  progress,
  stage,
  stats,
}: {
  message: string;
  progress: number;
  stage: PipelineStage;
  stats?: ProgressStats;
}) {
  const current = stepIndex(stage);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex items-end gap-1 text-orange">
        <Sparkle className="sparkle h-7 w-7" />
        <Sparkle className="sparkle h-11 w-11" />
        <Sparkle className="sparkle h-6 w-6" />
      </div>
      <h2 className="text-2xl font-bold tracking-[-0.03em]">Extracting…</h2>
      <p className="mt-2 text-sm text-muted">Usually 30–60 seconds for a short paper.</p>
      <p className="mt-4 max-w-md text-sm text-zinc-600">{message}</p>

      <ol className="mt-8 w-full max-w-sm space-y-2 text-left">
        {STEPS.map((step, index) => {
          const done = index < current || stage === "done";
          const active = index === current && stage !== "done";
          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 rounded-2xl px-3 py-2.5 transition-colors duration-200 ${
                active ? "bg-orange/5" : ""
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? "bg-emerald-500 text-white" : active ? "bg-orange text-white" : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${active ? "text-zinc-950" : "text-zinc-500"}`}>
                  {step.label}
                </span>
                <span className="block text-xs text-muted">{stepStat(step.id, stats) || step.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 h-1.5 w-56 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-orange transition-all duration-500 ease-out"
          style={{ width: `${Math.max(8, progress)}%` }}
        />
      </div>
    </div>
  );
}

function stepStat(id: PipelineStage, stats?: ProgressStats) {
  if (!stats) return "";
  if (id === "questions" && stats.questions != null) {
    return `${stats.questions} question${stats.questions === 1 ? "" : "s"} found`;
  }
  if (id === "answers" && stats.answers != null) {
    return `${stats.answers} region${stats.answers === 1 ? "" : "s"} found`;
  }
  if (id === "mapping" && stats.mapped != null) {
    return `${stats.mapped} matched · ${stats.unanswered ?? 0} unanswered · ${stats.extra ?? 0} extra`;
  }
  return "";
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 1.6c.3 2.8 1.4 5.4 3.2 7.4 1.9 1.9 4.5 3.1 7.2 3.4-2.7.3-5.3 1.5-7.2 3.4-1.8 2-2.9 4.6-3.2 7.4-.3-2.8-1.4-5.4-3.2-7.4C6.9 13.9 4.3 12.7 1.6 12.4c2.7-.3 5.3-1.5 7.2-3.4C10.6 7 11.7 4.4 12 1.6Z" />
    </svg>
  );
}
