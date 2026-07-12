import { ContactsManager } from "@/components/admin/contacts/contacts-manager";
import type { SiteLinksInitial } from "@/components/admin/contacts/links-settings-manager";
import type { TicketRow, TicketsPage } from "@/components/admin/contacts/tickets-table";
import { requireAdminPage } from "@/lib/admin/auth";
import { listTickets } from "@/lib/contact/service";
import { getSiteSettings } from "@/lib/settings/service";

const ADMIN_TICKETS_PAGE_SIZE = 20;

export default async function AdminContactsPage() {
  await requireAdminPage();

  const [{ tickets, total, nextCursor }, settings] = await Promise.all([
    listTickets({ limit: ADMIN_TICKETS_PAGE_SIZE }),
    getSiteSettings(),
  ]);

  const rows: TicketRow[] = tickets.map((ticket) => ({
    id: ticket._id,
    ticketId: ticket.ticketId,
    name: ticket.name,
    email: ticket.email,
    subject: ticket.subject ?? "",
    status: ticket.status,
    createdAt: new Date(ticket.createdAt).toISOString(),
  }));

  const initialTickets: TicketsPage = { rows, nextCursor, total };

  const links: SiteLinksInitial = {
    socialLinks: settings.socialLinks.map((link) => ({ ...link, value: link.value ?? "" })),
    contactLinks: settings.contactLinks.map((link) => ({ ...link, value: link.value ?? "" })),
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Contactos
        </p>
        <h1 className="text-xl font-semibold text-foreground">Pedidos de contacto</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Reveja as mensagens recebidas e configure as ligações e redes sociais mostradas na página
          pública de contactos.
        </p>
      </header>

      <ContactsManager tickets={initialTickets} links={links} />
    </div>
  );
}
