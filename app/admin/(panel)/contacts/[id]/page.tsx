import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketDetail, type TicketDetailData } from "@/components/admin/contacts/ticket-detail";
import { requireAdminPage } from "@/lib/admin/auth";
import { getTicket } from "@/lib/contact/service";

type RouteParams = { params: Promise<{ id: string }> };

export default async function AdminContactDetailPage({ params }: RouteParams) {
  await requireAdminPage();

  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const initial: TicketDetailData = {
    id: ticket._id,
    ticketId: ticket.ticketId,
    name: ticket.name,
    email: ticket.email,
    subject: ticket.subject ?? "",
    message: ticket.message,
    affiliation: ticket.affiliation ?? "",
    position: ticket.position ?? "",
    status: ticket.status,
    createdAt: new Date(ticket.createdAt).toISOString(),
    confirmationEmailSentAt: ticket.confirmationEmailSentAt
      ? new Date(ticket.confirmationEmailSentAt).toISOString()
      : null,
    meta: {
      country: ticket.meta?.country,
      region: ticket.meta?.region,
      city: ticket.meta?.city,
      userAgent: ticket.meta?.userAgent,
      referer: ticket.meta?.referer,
      locale: ticket.meta?.locale,
    },
    notes: (ticket.notes ?? []).map((note) => ({
      content: note.content,
      createdAt: new Date(note.createdAt).toISOString(),
    })),
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Link
          href="/admin/contacts"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Contactos
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold text-foreground">{ticket.name}</h1>
          <span className="font-mono text-sm text-muted-foreground">{ticket.ticketId}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Pedido de contacto recebido através da página pública.
        </p>
      </header>

      <TicketDetail initial={initial} />
    </div>
  );
}
