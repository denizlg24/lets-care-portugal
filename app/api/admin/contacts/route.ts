import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { handleRouteError } from "@/lib/api/responses";
import {
  getTicketStats,
  listTickets,
  TICKET_SORT_KEYS,
  type TicketSortDirection,
  type TicketSortKey,
} from "@/lib/contact/service";
import { TICKET_STATUSES, type TicketStatus } from "@/models/ContactTicket";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const searchParams = new URL(request.url).searchParams;

    const statusParam = searchParams.get("status");
    const status = TICKET_STATUSES.includes(statusParam as TicketStatus)
      ? (statusParam as TicketStatus)
      : undefined;

    const sortParam = searchParams.get("sort");
    const sort = TICKET_SORT_KEYS.includes(sortParam as TicketSortKey)
      ? (sortParam as TicketSortKey)
      : undefined;

    const dirParam = searchParams.get("dir");
    const direction =
      dirParam === "asc" || dirParam === "desc" ? (dirParam as TicketSortDirection) : undefined;

    const q = searchParams.get("q") ?? undefined;
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Number.parseInt(searchParams.get("limit") ?? "", 10) || 20;

    const [list, stats] = await Promise.all([
      listTickets({ status, q, sort, direction, cursor, limit }),
      getTicketStats(),
    ]);

    return NextResponse.json({ ...list, stats });
  } catch (error) {
    return handleRouteError("admin/contacts", error);
  }
}
