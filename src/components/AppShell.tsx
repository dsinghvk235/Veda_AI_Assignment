"use client";

import { Sidebar } from "./Sidebar";
import { ShellProvider } from "./shell-context";
import { TopBar } from "./TopBar";

export function AppShell({
  children,
  title = "Exams",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <ShellProvider>
      <div className="min-h-dvh bg-canvas p-2.5 sm:p-3.5">
        <div className="flex min-h-[calc(100dvh-1.25rem)] gap-2.5 sm:min-h-[calc(100dvh-1.75rem)] sm:gap-3.5">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:gap-3.5">
            <TopBar title={title} />
            <main className="droplet-stage flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
          </div>
        </div>
      </div>
    </ShellProvider>
  );
}
