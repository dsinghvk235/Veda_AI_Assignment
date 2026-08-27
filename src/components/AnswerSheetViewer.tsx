"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { ExtractedAnswer, MappedItem, MappingMethod, Region, Verdict } from "@/lib/types";
import { methodLabel } from "@/lib/review";

const EMPTY_REGIONS: Region[] = [];

function regionStyle(region: Region) {
  return {
    top: `${(region.ymin / 1000) * 100}%`,
    left: `${(region.xmin / 1000) * 100}%`,
    height: `${((region.ymax - region.ymin) / 1000) * 100}%`,
    width: `${((region.xmax - region.xmin) / 1000) * 100}%`,
  };
}

function highlightClass(method: MappingMethod | undefined) {
  if (method === "semantic") {
    return "highlight-box semantic border-dashed border-amber-500 bg-amber-400/10";
  }
  if (method === "manual") {
    return "highlight-box manual border-solid border-zinc-900 bg-zinc-900/5";
  }
  return "highlight-box border-solid border-orange bg-orange/10";
}

export function AnswerSheetViewer({
  pages,
  item,
  unmapped = [],
  selectedUnmappedId,
  onSelectUnmapped,
}: {
  pages: Array<{ page: number; mimeType: string; data: string }>;
  item: MappedItem | null;
  unmapped?: ExtractedAnswer[];
  selectedUnmappedId?: string | null;
  onSelectUnmapped?: (id: string) => void;
}) {
  return (
    <AnswerSheetViewerInner
      key={item?.question.id ?? selectedUnmappedId ?? "none"}
      pages={pages}
      item={item}
      unmapped={unmapped}
      selectedUnmappedId={selectedUnmappedId}
      onSelectUnmapped={onSelectUnmapped}
    />
  );
}

function AnswerSheetViewerInner({
  pages,
  item,
  unmapped = [],
  selectedUnmappedId,
  onSelectUnmapped,
}: {
  pages: Array<{ page: number; mimeType: string; data: string }>;
  item: MappedItem | null;
  unmapped?: ExtractedAnswer[];
  selectedUnmappedId?: string | null;
  onSelectUnmapped?: (id: string) => void;
}) {
  const regions = item?.answer?.regions ?? EMPTY_REGIONS;
  const pageSet = useMemo(() => new Set(regions.map((region) => region.page)), [regions]);
  const firstHighlighted =
    regions[0]?.page ??
    unmapped.find((answer) => answer.id === selectedUnmappedId)?.regions[0]?.page ??
    1;
  const [page, setPage] = useState(firstHighlighted);
  const [zoom, setZoom] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page, item?.question.id]);

  if (!pages.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted">
        Answer sheet preview is unavailable.
      </div>
    );
  }

  const current = pages.find((entry) => entry.page === page) ?? pages[0];
  const src = `data:${current.mimeType};base64,${current.data}`;
  const pageRegions = regions.filter((region) => region.page === current.page);
  const unanswered = Boolean(item && !item.answer);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f7f6f4]">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-white px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold">Answer sheet</p>
          <p className="truncate text-[12px] font-medium text-zinc-600">
            {item?.answer
              ? `Q${item.question.number} · ${regions.length} region${regions.length === 1 ? "" : "s"}`
              : unanswered
                ? `Q${item?.question.number} — no writing found`
                : "Select a question"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn label="Zoom out" onClick={() => setZoom((value) => Math.max(0.7, value - 0.15))}>
            <Minus size={14} />
          </IconBtn>
          <button
            type="button"
            className="rounded-full px-2 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-100"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>
          <IconBtn label="Zoom in" onClick={() => setZoom((value) => Math.min(2, value + 0.15))}>
            <Plus size={14} />
          </IconBtn>
          <IconBtn label="Previous page" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            <ChevronLeft size={16} />
          </IconBtn>
          <span className="text-[11px] font-medium">
            {page}/{pages.length}
          </span>
          <IconBtn
            label="Next page"
            disabled={page >= pages.length}
            onClick={() => setPage((value) => value + 1)}
          >
            <ChevronRight size={16} />
          </IconBtn>
        </div>
      </div>

      {pages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-line bg-white px-3 py-2">
          {pages.map((entry) => {
            const hasHit = pageSet.has(entry.page);
            const extra = unmapped.some((answer) => answer.regions.some((region) => region.page === entry.page));
            return (
              <button
                key={entry.page}
                type="button"
                onClick={() => setPage(entry.page)}
                className={`relative h-14 w-10 shrink-0 overflow-hidden rounded-md ring-1 transition ${
                  entry.page === page ? "ring-orange" : "ring-black/10 hover:ring-zinc-400"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${entry.mimeType};base64,${entry.data}`}
                  alt={`Page ${entry.page}`}
                  className="h-full w-full object-cover"
                />
                {hasHit && <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange" />}
                {extra && !hasHit && (
                  <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-zinc-400" />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div
          ref={pageRef}
          className="relative mx-auto origin-top rounded-xl bg-white shadow-sm transition-transform duration-200"
          style={{ width: `${Math.min(720 * zoom, 960)}px`, maxWidth: "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Answer sheet page ${current.page}`}
            className={`block w-full rounded-xl transition duration-200 ${unanswered ? "opacity-55" : ""}`}
          />
          {unanswered && (
            <div className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
              <span className="rounded-full bg-zinc-950/80 px-3 py-1 text-[11px] font-semibold text-white">
                No writing found for Q{item?.question.number}
              </span>
            </div>
          )}
          {pageRegions.map((region, index) => (
            <div
              key={`${region.page}-${index}`}
              className={`pointer-events-none absolute rounded-lg border-2 ${highlightClass(item?.method)}`}
              style={regionStyle(region)}
            >
              <span className="absolute -top-7 left-0 inline-flex items-center rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white shadow-[0_6px_16px_rgba(0,0,0,0.22)]">
                Q{item?.question.number}
                {pageSet.size > 1 ? ` · p${region.page}` : ""}
              </span>
            </div>
          ))}
          {unmapped.flatMap((answer) =>
            answer.regions
              .filter((region) => region.page === current.page)
              .map((region, index) => (
                <button
                  key={`${answer.id}-${index}`}
                  type="button"
                  onClick={() => onSelectUnmapped?.(answer.id)}
                  className={`absolute rounded-lg border-2 border-dashed transition ${
                    selectedUnmappedId === answer.id
                      ? "border-zinc-900 bg-zinc-900/10"
                      : "border-zinc-400/80 bg-zinc-400/10 hover:border-zinc-600"
                  }`}
                  style={regionStyle(region)}
                  title="Unmapped writing"
                >
                  <span className="absolute -top-6 left-0 rounded-full bg-zinc-700 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                    Extra
                  </span>
                </button>
              ))
          )}
        </div>
      </div>

      {item && <MappingFeedback item={item} />}
    </div>
  );
}

function MappingFeedback({ item }: { item: MappedItem }) {
  const accent = verdictAccent(item.verdict);
  return (
    <aside className="shrink-0 border-t border-zinc-200 bg-white px-4 py-4 sm:px-5">
      <div className={`min-h-[220px] overflow-hidden rounded-2xl bg-white ring-1 ${accent.ring}`}>
        <div className={`h-1.5 ${accent.bar}`} />
        <div className="grid min-h-[208px] gap-5 px-5 py-4 sm:grid-cols-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-[12px] font-bold text-white">
                Q{item.question.number}
              </span>
              <VerdictChip verdict={item.verdict} score={item.score} max={item.question.maxMarks} />
            </div>
            <p className="mt-3 text-[11px] font-bold tracking-[0.06em] text-zinc-900 uppercase">Feedback</p>
            <p className="mt-1.5 max-h-[9.5rem] overflow-y-auto text-[15px] leading-6 font-medium text-zinc-900">
              {item.feedback || "No feedback for this question."}
            </p>
            <p className="mt-3 text-[12px] font-medium text-zinc-600">{methodLabel(item.method)}</p>
          </div>
          <div className="min-w-0 border-t border-zinc-200 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-5">
            <p className="text-[11px] font-bold tracking-[0.06em] text-zinc-900 uppercase">Student answer</p>
            <p className="mt-1.5 max-h-[9.5rem] overflow-y-auto text-[15px] leading-6 text-zinc-800">
              {item.answer?.text ?? "No answer found on the sheet."}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function verdictAccent(verdict: Verdict) {
  if (verdict === "correct") return { bar: "bg-emerald-500", ring: "ring-emerald-100" };
  if (verdict === "partial") return { bar: "bg-amber-500", ring: "ring-amber-100" };
  if (verdict === "incorrect") return { bar: "bg-red-500", ring: "ring-red-100" };
  return { bar: "bg-zinc-400", ring: "ring-zinc-200" };
}

function VerdictChip({
  verdict,
  score,
  max,
}: {
  verdict: Verdict;
  score: number;
  max: number;
}) {
  const tone =
    verdict === "correct"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
      : verdict === "partial"
        ? "bg-amber-50 text-amber-800 ring-amber-100"
        : verdict === "incorrect"
          ? "bg-red-50 text-red-800 ring-red-100"
          : "bg-zinc-100 text-zinc-600 ring-zinc-200";
  const label = verdict === "unanswered" ? "Unanswered" : `${score}/${max}`;
  const caption =
    verdict === "unanswered" ? null : verdict === "correct" ? "Correct" : verdict === "partial" ? "Partial" : "Incorrect";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${tone}`}>
      {label}
      {caption && <span className="font-semibold text-current">{caption}</span>}
    </span>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-full border border-line p-1 text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
