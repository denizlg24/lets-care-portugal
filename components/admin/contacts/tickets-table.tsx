"use client";

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/models/ContactTicket";

export interface TicketRow {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
}

export interface TicketsPage {
  rows: TicketRow[];
  nextCursor: string | null;
  total: number;
}

type SortKey = "createdAt" | "name" | "status";
type SortDirection = "asc" | "desc";

interface Filters {
  status: TicketStatus | "";
  q: string;
  sort: SortKey;
  direction: SortDirection;
}

const DEFAULT_FILTERS: Filters = { status: "", q: "", sort: "createdAt", direction: "desc" };
const PAGE_SIZE = 20;

export const TICKET_STATUS_UI: Record<
  TicketStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "ghost" | "destructive" }
> = {
  new: { label: "Novo", variant: "default" },
  open: { label: "Aberto", variant: "secondary" },
  resolved: { label: "Resolvido", variant: "outline" },
  archived: { label: "Arquivado", variant: "ghost" },
  spam: { label: "Spam", variant: "destructive" },
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

// biome-ignore lint/suspicious/noExplicitAny: narrows the API payload below
function toRow(ticket: any): TicketRow {
  return {
    id: String(ticket._id),
    ticketId: ticket.ticketId,
    name: ticket.name,
    email: ticket.email,
    subject: ticket.subject ?? "",
    status: ticket.status,
    createdAt: ticket.createdAt,
  };
}

interface TicketsTableProps {
  initial: TicketsPage;
}

export function TicketsTable({ initial }: TicketsTableProps) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [qInput, setQInput] = useState("");
  const [page, setPage] = useState<TicketsPage>(initial);
  // Cursors that produced the current page and the ones before it; index 0
  // (no cursor) is the first page, so length-1 is the current page number.
  const [cursorTrail, setCursorTrail] = useState<(string | undefined)[]>([undefined]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPage(next: Filters, trail: (string | undefined)[]) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        sort: next.sort,
        dir: next.direction,
        limit: String(PAGE_SIZE),
      });
      if (next.status) params.set("status", next.status);
      if (next.q) params.set("q", next.q);
      const cursor = trail[trail.length - 1];
      if (cursor) params.set("cursor", cursor);

      const response = await fetchWithTimeout(`/api/admin/contacts?${params.toString()}`);
      if (!response.ok) throw new Error("request failed");
      const data = await response.json();

      setPage({
        rows: (data.tickets ?? []).map(toRow),
        nextCursor: data.nextCursor ?? null,
        total: data.total ?? 0,
      });
      setFilters(next);
      setCursorTrail(trail);
    } catch {
      setError("Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(patch: Partial<Filters>) {
    fetchPage({ ...filters, ...patch }, [undefined]);
  }

  function toggleSort(key: SortKey) {
    if (filters.sort === key) {
      applyFilters({ direction: filters.direction === "asc" ? "desc" : "asc" });
      return;
    }
    applyFilters({ sort: key, direction: key === "createdAt" ? "desc" : "asc" });
  }

  function goNext() {
    if (!page.nextCursor) return;
    fetchPage(filters, [...cursorTrail, page.nextCursor]);
  }

  function goPrevious() {
    if (cursorTrail.length <= 1) return;
    fetchPage(filters, cursorTrail.slice(0, -1));
  }

  const pageNumber = cursorTrail.length;
  const filtered = Boolean(filters.status || filters.q);

  function sortHeader(key: SortKey, label: string, className?: string) {
    const active = filters.sort === key;
    const Icon = !active ? ArrowUpDown : filters.direction === "asc" ? ArrowUp : ArrowDown;
    return (
      <th
        className={cn("py-2 pr-4", className)}
        aria-sort={active ? (filters.direction === "asc" ? "ascending" : "descending") : undefined}
      >
        <button
          type="button"
          onClick={() => toggleSort(key)}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors",
            active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
          <Icon className="size-3" aria-hidden />
        </button>
      </th>
    );
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          applyFilters({ q: qInput.trim() });
        }}
      >
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            placeholder="Nome, email, assunto ou n.º de pedido"
            aria-label="Pesquisar pedidos"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={loading}>
          Pesquisar
        </Button>
        <NativeSelect
          className="ml-auto"
          value={filters.status}
          onChange={(event) => applyFilters({ status: event.target.value as TicketStatus | "" })}
          aria-label="Filtrar por estado"
        >
          <NativeSelectOption value="">Todos os estados</NativeSelectOption>
          {Object.entries(TICKET_STATUS_UI).map(([value, ui]) => (
            <NativeSelectOption key={value} value={value}>
              {ui.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </form>

      {error ? (
        <p className="border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}

      {page.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <Inbox className="mx-auto size-6 text-muted-foreground" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            {filtered ? "Nenhum pedido corresponde aos filtros" : "Ainda não há pedidos"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered
              ? "Ajuste a pesquisa ou o estado para ver mais resultados."
              : "As mensagens enviadas na página de contactos aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className={cn("overflow-x-auto", loading && "pointer-events-none opacity-60")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pedido
                </th>
                {sortHeader("name", "Contacto")}
                {sortHeader("status", "Estado")}
                {sortHeader("createdAt", "Data", "hidden sm:table-cell")}
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {page.rows.map((row) => {
                const status = TICKET_STATUS_UI[row.status];
                return (
                  <tr key={row.id} className="border-b border-border align-top last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/contacts/${row.id}`}
                        className="font-mono text-xs font-semibold text-foreground hover:underline"
                      >
                        {row.ticketId}
                      </Link>
                      <div className="max-w-56 truncate text-xs text-muted-foreground">
                        {row.subject || "Sem assunto"}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground">{row.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{row.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="hidden whitespace-nowrap py-3 pr-4 text-muted-foreground sm:table-cell">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/admin/contacts/${row.id}`}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Ver
                        <ChevronRight className="ml-0.5 inline size-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Página {pageNumber} · {page.total} {page.total === 1 ? "pedido" : "pedidos"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goPrevious}
            disabled={loading || cursorTrail.length <= 1}
          >
            <ChevronLeft data-icon="inline-start" />
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={loading || !page.nextCursor}
          >
            Seguinte
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
