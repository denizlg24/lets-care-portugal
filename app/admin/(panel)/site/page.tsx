import { NotificationEmailsManager } from "@/components/admin/site/notification-emails-manager";
import type { SiteConfigInitial } from "@/components/admin/site/site-config-manager";
import { SiteConfigManager } from "@/components/admin/site/site-config-manager";
import { requireAdminPage } from "@/lib/admin/auth";
import { getNotificationEmails, getSiteConfig } from "@/lib/settings/service";

export default async function AdminSitePage() {
  await requireAdminPage();

  const [config, notificationEmails] = await Promise.all([
    getSiteConfig(),
    getNotificationEmails(),
  ]);

  const initial: SiteConfigInitial = {
    name: config.name,
    shortName: config.shortName,
    title: config.title,
    description: config.description,
    consortiumText: config.consortiumText,
    consortiumHref: config.consortiumHref,
    projectLine: config.projectLine,
    fundingDisclaimer: config.fundingDisclaimer,
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Site</p>
        <h1 className="text-xl font-semibold text-foreground">Configuração do site</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Edite o nome, a descrição e os metadados do site, e os textos apresentados no rodapé de
          todas as páginas.
        </p>
      </header>

      <SiteConfigManager initial={initial} />

      <div className="border-t border-border pt-8">
        <NotificationEmailsManager initial={notificationEmails} />
      </div>
    </div>
  );
}
