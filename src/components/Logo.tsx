"use client";

import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#111111] text-[15px] font-extrabold text-white">
        V
      </span>
      {!compact && (
        <span className="truncate text-[18px] font-extrabold tracking-tight text-[#111111]">
          VedaAI
        </span>
      )}
    </Link>
  );
}
