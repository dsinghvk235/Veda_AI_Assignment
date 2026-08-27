import { AppShell } from "@/components/AppShell";
import { UploadWorkspace } from "@/components/UploadWorkspace";

export default function HomePage() {
  return (
    <AppShell>
      <UploadWorkspace />
    </AppShell>
  );
}
