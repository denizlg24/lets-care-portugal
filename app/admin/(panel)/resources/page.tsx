import { ResourcesManager } from "@/components/admin/resources/resources-manager";
import { normalizeResource } from "@/components/admin/resources/shared";
import { requireAdminPage } from "@/lib/admin/auth";
import { listResources } from "@/lib/resources/service";

export default async function AdminResourcesPage() {
  await requireAdminPage();

  const resources = await listResources();

  // Reuse the shared normalizer so freshly created/updated rows in the client
  // manager keep the exact same shape as the server-rendered ones.
  const resourceItems = resources.map(normalizeResource);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recursos
        </p>
        <h1 className="text-xl font-semibold text-foreground">Recursos</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Gerir relatórios do projeto, publicações científicas, policy briefs e materiais
          pedagógicos que aparecem na página pública de recursos.
        </p>
      </header>

      <ResourcesManager resources={resourceItems} />
    </div>
  );
}
