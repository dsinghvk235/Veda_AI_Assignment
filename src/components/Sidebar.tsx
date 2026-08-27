"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ClipboardList,
  FileText,
  LayoutGrid,
  PanelLeft,
  PieChart,
  Presentation,
  ChevronsRight,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useShell } from "./shell-context";

const items = [
  { href: "/", icon: LayoutGrid, label: "Home", match: "never" as const },
  { href: "/", icon: Presentation, label: "My Classroom", match: "never" as const },
  { href: "/review", icon: FileText, label: "Assignments", match: "prefix" as const },
  { href: "/", icon: ClipboardList, label: "Exams", match: "exact" as const },
  { href: "/library", icon: PieChart, label: "My Library", match: "prefix" as const },
];

export function Sidebar() {
  const pathname = usePathname();
  const { expanded, mobileOpen, toggleExpanded, closeMobile } = useShell();

  const showExpanded = expanded || mobileOpen;

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[60] bg-black/30 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`droplet-sidebar z-50 shrink-0 flex-col ${
          showExpanded ? "w-[252px] rounded-[28px]" : "w-[76px] rounded-[40px]"
        } ${
          mobileOpen
            ? "fixed top-3 left-3 z-[70] flex max-h-[calc(100dvh-1.5rem)] min-h-0 overflow-y-auto md:static md:z-50 md:max-h-none md:overflow-visible"
            : "hidden md:flex"
        }`}
      >
        <div className={`flex items-center ${showExpanded ? "justify-between px-4" : "justify-center"} pt-1`}>
          <Logo compact={!showExpanded} />
          {showExpanded && (
            <button
              type="button"
              onClick={() => {
                if (mobileOpen) closeMobile();
                else toggleExpanded();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9a9a9a] hover:bg-[#f3f3f3] hover:text-[#111]"
              title={mobileOpen ? "Close menu" : "Collapse sidebar"}
              aria-label={mobileOpen ? "Close menu" : "Collapse sidebar"}
            >
              {mobileOpen ? <X size={16} /> : <PanelLeft size={16} />}
            </button>
          )}
        </div>

        <div className={`${showExpanded ? "px-3" : "flex justify-center"} mt-5`}>
          <ToolkitButton expanded={showExpanded} />
        </div>

        <nav className={`mt-5 flex flex-1 flex-col gap-1 ${showExpanded ? "px-3" : "items-center px-2"}`}>
          {items.map((item) => {
            const active =
              item.match === "exact"
                ? pathname === item.href
                : item.match === "prefix"
                  ? pathname.startsWith(item.href)
                  : false;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                title={item.label}
                className={`flex h-11 items-center rounded-2xl text-[14px] transition ${
                  showExpanded ? "gap-3 px-3" : "w-11 justify-center"
                } ${
                  active
                    ? "bg-[#f0f0f0] font-semibold text-[#111111]"
                    : "font-medium text-[#8b8b8b] hover:bg-[#f6f6f6] hover:text-[#333]"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
                {showExpanded && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={`${showExpanded ? "px-3" : "flex flex-col items-center"} mt-4 pb-1`}>
          <SchoolCard compact={!showExpanded} />
          {!showExpanded && (
            <button
              type="button"
              onClick={toggleExpanded}
              title="Expand sidebar"
              className="mt-3 hidden h-10 w-10 items-center justify-center rounded-xl text-[#8b8b8b] hover:bg-[#f3f3f3] hover:text-[#111] md:flex"
            >
              <ChevronsRight size={18} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function ToolkitButton({ expanded }: { expanded: boolean }) {
  return (
    <Link
      href="/"
      title="AI Teacher’s Toolkit"
      className={`toolkit-glow flex items-center bg-[#1a1a1a] text-white transition hover:bg-black ${
        expanded
          ? "h-11 w-full gap-2.5 rounded-full px-4"
          : "h-11 w-11 justify-center rounded-full"
      }`}
    >
      <Sparkles className="h-4 w-4 shrink-0" />
      {expanded && (
        <span className="truncate text-[13px] font-semibold tracking-[-0.01em]">
          AI Teacher’s Toolkit
        </span>
      )}
    </Link>
  );
}

function SchoolCard({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f3f3]" title="Delhi Public School">
        <SchoolCrest />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-[#f3f3f3] px-2.5 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
        <SchoolCrest />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold text-[#111]">Delhi Public School</span>
        <span className="block truncate text-[11px] text-[#8b8b8b]">Bokaro Steel City</span>
      </span>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7.5 2.4c.22 1.9.95 3.6 2.15 4.9 1.2 1.3 2.95 2.1 4.85 2.35-1.9.25-3.65 1.05-4.85 2.35C8.45 13.3 7.72 15 7.5 16.9c-.22-1.9-.95-3.6-2.15-4.9C4.15 10.7 2.4 9.9.5 9.65c1.9-.25 3.65-1.05 4.85-2.35C6.55 6 7.28 4.3 7.5 2.4Z" />
      <path d="M17.6 11.2c.14 1.2.6 2.28 1.35 3.1.76.84 1.86 1.35 3.05 1.5-1.19.15-2.29.66-3.05 1.5-.75.82-1.21 1.9-1.35 3.1-.14-1.2-.6-2.28-1.35-3.1-.76-.84-1.86-1.35-3.05-1.5 1.19-.15 2.29-.66 3.05-1.5.75-.82 1.21-1.9 1.35-3.1Z" />
    </svg>
  );
}

function SchoolCrest() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="15" fill="#1f7a4d" />
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="white" strokeWidth="1.4" />
      <path d="M16 7.5 20.2 16l-4.2 8.5L11.8 16 16 7.5Z" fill="white" />
      <circle cx="16" cy="16" r="2.2" fill="#1f7a4d" />
    </svg>
  );
}
