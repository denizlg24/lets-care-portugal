import { AccessManager } from "@/components/admin/access-manager";
import { getCurrentRootAdminSession, requireAdminPage } from "@/lib/admin/auth";
import { getRootAdminEmail } from "@/lib/admin/root";
import { listAdminAccessUsers } from "@/lib/admin/users";

export default async function AdminAccessPage() {
  const session = await requireAdminPage();
  const rootSession = await getCurrentRootAdminSession();
  const rootConfigured = Boolean(getRootAdminEmail());
  const users = rootSession ? await listAdminAccessUsers() : [];

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acesso</p>
        <h1 className="text-xl font-semibold text-foreground">Acesso de administração</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Reveja pedidos pendentes e contas de administração existentes.
        </p>
      </header>

      <AccessManager
        users={users}
        canManage={Boolean(rootSession)}
        rootConfigured={rootConfigured}
        currentUserId={session.user.id}
      />
    </div>
  );
}
