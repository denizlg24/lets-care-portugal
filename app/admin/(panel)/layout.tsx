import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { requireAdminPage } from "@/lib/admin/auth";

export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();

  return (
    <QueryProvider>
      <AdminShell session={session}>{children}</AdminShell>
    </QueryProvider>
  );
}
