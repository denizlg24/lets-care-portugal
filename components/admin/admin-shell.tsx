import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { isRootAdminSession } from "@/lib/admin/root";
import type { Session } from "@/lib/auth";

interface AdminShellProps {
  children: ReactNode;
  session: Session;
}

export function AdminShell({ children, session }: AdminShellProps) {
  const isRoot = isRootAdminSession(session);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-border lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="px-5 py-5">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            Administração
          </p>
          <p className="mt-1 text-sm font-semibold leading-tight text-foreground">
            LeTs Care Portugal
          </p>
        </div>
        <AdminNav orientation="vertical" className="flex-1 px-3" />
        <div className="border-t border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {session.user.email}
            </p>
            {isRoot ? (
              <Badge className="shrink-0" variant="outline">
                Principal
              </Badge>
            ) : null}
          </div>
          <SignOutButton showLabel className="mt-2" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
                Administração
              </p>
              <p className="truncate text-sm font-semibold leading-tight">LeTs Care Portugal</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isRoot ? <Badge variant="outline">Principal</Badge> : null}
              <SignOutButton />
            </div>
          </div>
          <AdminNav orientation="horizontal" className="border-t border-border px-2 py-1.5" />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
