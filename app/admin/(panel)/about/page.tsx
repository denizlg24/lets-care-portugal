import type { AboutInitial } from "@/components/admin/about/about-manager";
import { AboutManager } from "@/components/admin/about/about-manager";
import { getAboutSettings } from "@/lib/about/service";
import { requireAdminPage } from "@/lib/admin/auth";

export default async function AdminAboutPage() {
  await requireAdminPage();

  const settings = await getAboutSettings();

  const initial: AboutInitial = {
    sections: settings.sections.map((section) => ({
      title: section.title,
      body: section.body,
      image: section.image ?? "",
      imageAlt: section.imageAlt ?? "",
    })),
    team: settings.team.map((member) => ({
      image: member.image ?? "",
      name: member.name,
      abstract: member.abstract ?? "",
      links: member.links.map((link) => ({ ...link })),
    })),
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Sobre Nós
        </p>
        <h1 className="text-xl font-semibold text-foreground">Página Sobre Nós</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Edite as secções de conteúdo e faça a gestão dos membros da equipa apresentados na página
          pública.
        </p>
      </header>

      <AboutManager initial={initial} />
    </div>
  );
}
