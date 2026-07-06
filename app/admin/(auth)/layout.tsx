import type { ReactNode } from "react";
import { redirectAdminAwayFromAuth } from "@/lib/admin/auth";

export default async function AdminAuthLayout({ children }: { children: ReactNode }) {
  await redirectAdminAwayFromAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
