import { LegalManager } from "@/components/admin/legal/legal-manager";
import { requireAdminPage } from "@/lib/admin/auth";
import { listLegalPages } from "@/lib/legal/service";

export default async function AdminLegalPage() {
  await requireAdminPage();

  const pages = await listLegalPages();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Legal</p>
        <h1 className="text-xl font-semibold text-foreground">Páginas legais</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Editar a política de privacidade, os termos e condições, a política de cookies e a
          declaração de acessibilidade. Enquanto uma página não for guardada, o site mostra o
          conteúdo padrão, escrito para a lei portuguesa — reveja nomes, contactos e prazos antes de
          publicar.
        </p>
      </header>

      <LegalManager pages={pages} />
    </div>
  );
}
