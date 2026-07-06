import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { handleRouteError } from "@/lib/api/responses";
import { getTicketStats, listTickets } from "@/lib/contact/service";
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
    const q = searchParams.get("q") ?? undefined;
    const country = searchParams.get("country") ?? undefined;
    const page = Number.parseInt(searchParams.get("page") ?? "", 10) || 1;
    const limit = Number.parseInt(searchParams.get("limit") ?? "", 10) || 20;

    const [list, stats] = await Promise.all([
      listTickets({ status, q, country, page, limit }),
      getTicketStats(),
    ]);

    return NextResponse.json({ ...list, stats });
  } catch (error) {
    return handleRouteError("admin/contacts", error);
  }
}
