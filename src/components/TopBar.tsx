"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, Menu } from "lucide-react";
import { Logo } from "./Logo";
import { HelpDialog } from "./HelpDialog";
import { useShell } from "./shell-context";

export function TopBar({ title = "Exams" }: { title?: string }) {
  const { openMobile } = useShell();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="droplet-header flex h-14 w-full shrink-0 items-center justify-between gap-3 px-3 sm:h-[58px] sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 md:hidden"
            onClick={openMobile}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <span className="md:hidden">
            <Logo />
          </span>
          <p className="hidden truncate text-[15px] font-semibold tracking-[-0.01em] md:block">{title}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-zinc-100"
            title="How this works"
            aria-label="How this works"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle size={18} />
          </button>
          <div className="ml-0.5 flex max-w-[200px] items-center gap-2 rounded-full py-1 pr-2 pl-1 sm:max-w-none sm:pr-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ff7a55,#c43b1c)] text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(255,92,51,0.35)]">
              DS
            </span>
            <span className="hidden truncate text-sm font-medium min-[480px]:block">Divyanshu Singh</span>
            <ChevronDown size={14} className="hidden text-muted min-[480px]:block" />
          </div>
        </div>
      </header>
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
    </>
  );
}
