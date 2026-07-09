"use client";

import { Loader2, Mail, StickyNote, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TICKET_STATUS_UI } from "@/components/admin/contacts/tickets-table";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/models/ContactTicket";

export interface TicketNoteData {
  content: string;
  createdAt: string;
}

export interface TicketDetailData {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  affiliation: string;
  position: string;
  status: TicketStatus;
  createdAt: string;
  confirmationEmailSentAt: string | null;
  meta: {
    country?: string;
    region?: string;
    city?: string;
    userAgent?: string;
    referer?: string;
    locale?: string;
  };
  notes: TicketNoteData[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}

interface TicketDetailProps {
  initial: TicketDetailData;
}

export function TicketDetail({ initial }: TicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetailData>(initial);
  const [savingStatus, setSavingStatus] = useState(false);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(status: TicketStatus) {
    const previous = ticket.status;
    setError(null);
    setSavingStatus(true);
    setTicket((current) => ({ ...current, status }));
    try {
      const response = await fetchWithTimeout(`/api/admin/contacts/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("request failed");
    } catch {
      setTicket((current) => ({ ...current, status: previous }));
      setError("Não foi possível atualizar o estado.");
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddNote() {
    const content = note.trim();
    if (!content) return;
    setError(null);
    setSavingNote(true);
    try {
      const response = await fetchWithTimeout(`/api/admin/contacts/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: content }),
      });
      if (!response.ok) throw new Error("request failed");
      const data = await response.json();
      const notes: TicketNoteData[] = (data.ticket?.notes ?? []).map(
        (item: { content: string; createdAt: string }) => ({
          content: item.content,
          createdAt: item.createdAt,
        }),
      );
      setTicket((current) => ({ ...current, notes }));
      setNote("");
    } catch {
      setError("Não foi possível adicionar a nota.");
    } finally {
      setSavingNote(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Eliminar o pedido ${ticket.ticketId}? Esta ação não pode ser anulada.`)) {
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const response = await fetchWithTimeout(`/api/admin/contacts/${ticket.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("request failed");
      router.push("/admin/contacts");
      router.refresh();
    } catch {
      setError("Não foi possível eliminar o pedido.");
      setDeleting(false);
    }
  }

  const mailtoSubject = encodeURIComponent(
    `Re: ${ticket.subject || "O seu contacto"} [${ticket.ticketId}]`,
  );
  const meta: { label: string; value?: string }[] = [
    { label: "País", value: ticket.meta.country },
    { label: "Região", value: ticket.meta.region },
    { label: "Cidade", value: ticket.meta.city },
    { label: "Idioma", value: ticket.meta.locale },
    { label: "Origem", value: ticket.meta.referer },
    { label: "Navegador", value: ticket.meta.userAgent },
  ];
  const presentMeta = meta.filter((entry): entry is { label: string; value: string } =>
    Boolean(entry.value),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <a
          className={cn(buttonVariants({ size: "sm" }))}
          href={`mailto:${ticket.email}?subject=${mailtoSubject}`}
        >
          <Mail data-icon="inline-start" />
          Responder por email
        </a>
        <div className="flex items-center gap-2">
          <NativeSelect
            value={ticket.status}
            onChange={(event) => handleStatusChange(event.target.value as TicketStatus)}
            disabled={savingStatus}
            aria-label="Estado do pedido"
            size="sm"
          >
            {Object.entries(TICKET_STATUS_UI).map(([value, ui]) => (
              <NativeSelectOption key={value} value={value}>
                {ui.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {savingStatus ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-destructive hover:text-destructive"
        >
          <Trash2 data-icon="inline-start" />
          Eliminar
        </Button>
      </div>

      {error ? (
        <p className="border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-border p-5">
            <h2 className="text-base font-semibold text-foreground">
              {ticket.subject || "Sem assunto"}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {ticket.message}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Notas internas</h2>
            {ticket.notes.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Sem notas. Registe aqui o seguimento dado a este pedido.
              </p>
            ) : (
              <ul className="space-y-2">
                {ticket.notes.map((item, index) => (
                  // Notes are append-only; position identifies them.
                  // biome-ignore lint/suspicious/noArrayIndexKey: append-only list
                  <li key={index} className="rounded-lg bg-muted/40 p-3">
                    <p className="whitespace-pre-wrap text-sm text-foreground">{item.content}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Adicionar uma nota interna…"
                maxLength={2000}
                aria-label="Nova nota interna"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNote}
                disabled={savingNote || !note.trim()}
              >
                {savingNote ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <StickyNote data-icon="inline-start" />
                )}
                Adicionar nota
              </Button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground">Contacto</h2>
            <dl className="mt-4 space-y-4">
              <DetailRow label="Nome" value={ticket.name} />
              <DetailRow label="Email" value={ticket.email} />
              {ticket.affiliation ? (
                <DetailRow label="Afiliação" value={ticket.affiliation} />
              ) : null}
              {ticket.position ? <DetailRow label="Cargo" value={ticket.position} /> : null}
              <DetailRow label="Recebido" value={formatDate(ticket.createdAt)} />
              <div className="space-y-0.5">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Email de confirmação
                </dt>
                <dd className="text-sm text-foreground">
                  {ticket.confirmationEmailSentAt ? (
                    `Enviado a ${formatDate(ticket.confirmationEmailSentAt)}`
                  ) : (
                    <Badge variant="outline">Não enviado</Badge>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {presentMeta.length > 0 ? (
            <section className="rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold text-foreground">Contexto do pedido</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Recolhido dos cabeçalhos do pedido.
              </p>
              <dl className="mt-4 space-y-4">
                {presentMeta.map((entry) => (
                  <DetailRow key={entry.label} label={entry.label} value={entry.value} />
                ))}
              </dl>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
