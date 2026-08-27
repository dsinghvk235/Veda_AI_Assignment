"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AppShell } from "@/components/AppShell";
import { ReviewWorkspace } from "@/components/ReviewWorkspace";
import { loadLastAnalysis, subscribeBrowserStorage } from "@/lib/storage";

export default function ReviewPage() {
  const result = useSyncExternalStore(subscribeBrowserStorage, loadLastAnalysis, () => null);

  if (!result) {
    return (
      <AppShell title="Mapping">
        <div className="flex h-full min-h-0 flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-bold">No mapping yet</h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Upload a question paper and an answer sheet to extract questions and highlight answers.
          </p>
          <Link href="/" className="mt-6 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white">
            Upload files
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Question–answer mapping">
      <ReviewWorkspace result={result} />
    </AppShell>
  );
}
