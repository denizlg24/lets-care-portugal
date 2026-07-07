import type { ReactNode } from "react";
import { requireAdminPage } from "@/lib/admin/auth";

/**
 * Bare, full-screen shell for the distraction-free writing surface — no
 * sidebar or panel chrome, so the editor reads as the whole page. Still guarded
 * by the same admin check as the panel.
 */
export default async function WriteLayout({ children }: { children: ReactNode }) {
  await requireAdminPage();
  return <div className="min-h-screen bg-background">{children}</div>;
}
