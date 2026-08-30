"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { ExtractedAnswer, MappedItem, MappingMethod, Region, Verdict } from "@/lib/types";

const EMPTY_REGIONS: Region[] = [];

function regionStyle(region: Region) {
  return {
    top: `${(region.ymin / 1000) * 100}%`,
    left: `${(region.xmin / 1000) * 100}%`,
    height: `${((region.ymax - region.ymin) / 1000) * 100}%`,
    width: `${((region.xmax - region.xmin) / 1000) * 100}%`,
  };
}

function verdictHighlight(verdict: Verdict | undefined, method: MappingMethod | undefined) {
  const tone =
    verdict === "correct" ? "hl-correct" : verdict === "incorrect" ? "hl-incorrect" : "hl-partial";
  const dashed = method === "semantic" ? "hl-dashed" : "";
  return `highlight-box ${tone} ${dashed}`;
}

function chipClass(verdict: Verdict | undefined) {
  if (verdict === "correct") return "hl-chip hl-chip-correct";
  if (verdict === "incorrect") return "hl-chip hl-chip-incorrect";
  return "hl-chip hl-chip-partial";
}

function thumbDot(verdict: Verdict | undefined) {
  if (verdict === "correct") return "bg-[#16a34a]";
  if (verdict === "incorrect") return "bg-[#dc2626]";
  return "bg-[#ff5c33]";
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
  const selectedExtra = unmapped.find((answer) => answer.id === selectedUnmappedId) ?? null;
  const extraRegions = selectedExtra?.regions ?? EMPTY_REGIONS;
  const pageSet = useMemo(() => new Set(regions.map((region) => region.page)), [regions]);
  const firstHighlighted = regions[0]?.page ?? extraRegions[0]?.page ?? 1;
  const [page, setPage] = useState(firstHighlighted);
  const [zoom, setZoom] = useState(1);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    highlightRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [page, item?.question.id, selectedUnmappedId]);

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
                ? `Q${item?.question.number} — unanswered`
                : selectedExtra
                  ? "Extra writing"
                  : "Click a question to highlight its answer"}
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
                {hasHit && (
                  <span className={`absolute top-1 right-1 h-1.5 w-1.5 rounded-full ${thumbDot(item?.verdict)}`} />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        <div
          className="relative mx-auto origin-top rounded-xl bg-white shadow-sm"
          style={{ width: `${Math.min(720 * zoom, 960)}px`, maxWidth: "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Answer sheet page ${current.page}`} className="block w-full rounded-xl" />
          {unanswered && (
            <div className="pointer-events-none absolute inset-x-0 top-8 z-20 flex justify-center">
              <span className="rounded-full bg-zinc-950/80 px-3 py-1 text-[11px] font-semibold text-white">
                Unanswered — no writing for Q{item?.question.number}
              </span>
            </div>
          )}
          {pageRegions.map((region, index) => (
            <div
              key={`${region.page}-${index}`}
              ref={index === 0 ? highlightRef : undefined}
              className={`pointer-events-none absolute z-10 rounded-lg ${verdictHighlight(item?.verdict, item?.method)}`}
              style={regionStyle(region)}
            >
              <span className={chipClass(item?.verdict)}>
                Q{item?.question.number}
                {pageSet.size > 1 ? ` · p${region.page}` : ""}
              </span>
            </div>
          ))}
          {extraRegions
            .filter((region) => region.page === current.page)
            .map((region, index) => (
              <button
                key={`extra-${index}`}
                type="button"
                onClick={() => selectedExtra && onSelectUnmapped?.(selectedExtra.id)}
                className="hl-extra-on absolute z-10 rounded-lg"
                style={regionStyle(region)}
                title="Unmapped writing"
              >
                <span className="hl-chip" style={{ background: "#64748b" }}>
                  Extra
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
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
