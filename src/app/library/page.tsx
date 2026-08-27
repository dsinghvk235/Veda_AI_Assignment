"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/AppShell";
import { loadLibrarySnapshot, openPaper, subscribeBrowserStorage, type LibraryItem } from "@/lib/storage";

const EMPTY: LibraryItem[] = [];

export default function LibraryPage() {
  const router = useRouter();
  const items = useSyncExternalStore(subscribeBrowserStorage, loadLibrarySnapshot, () => EMPTY);

  function open(id: string) {
    const paper = openPaper(id);
    if (paper) router.push("/review");
  }

  return (
    <AppShell title="My library">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
        <h1 className="text-2xl font-extrabold tracking-tight">My library</h1>
        <p className="mt-2 text-sm text-muted">Recent mappings in this browser. Nothing is stored on a server.</p>
        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-line px-6 py-12 text-center">
            <p className="text-sm font-semibold">No papers yet</p>
            <p className="mt-1 text-sm text-muted">Upload a pair of files, or open the graded example.</p>
            <Link href="/" className="mt-6 inline-block text-sm font-semibold text-orange">
              Go to upload →
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => open(item.id)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-line px-4 py-3 text-left transition hover:bg-[#faf9f7]"
                >
                  {item.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnail} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover ring-1 ring-black/5" />
                  ) : (
                    <span className="flex h-14 w-10 shrink-0 items-center justify-center rounded-md bg-[#f3f1ee] text-[11px] font-bold text-muted">
                      PDF
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {item.studentName || item.questionFileName}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {item.answerFileName} · {item.answered}/{item.totalQuestions} answered
                      {item.unmapped ? ` · ${item.unmapped} extra` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold">
                    {item.graded === false ? "Mapped" : `${item.awardedMarks}/${item.totalMarks}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
