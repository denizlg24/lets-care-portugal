import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { ticketUpdateSchema } from "@/lib/contact/schemas";
import { addTicketNote, deleteTicket, getTicket, updateTicket } from "@/lib/contact/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const ticket = await getTicket(id);
    if (!ticket) return apiError(404, "Ticket not found");

    return NextResponse.json({ ticket });
  } catch (error) {
    return handleRouteError("admin/contacts/[id]", error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;

    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Invalid JSON body");

    const parsed = ticketUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { status, assignedTo, note } = parsed.data;

    let ticket = null;
    if (status !== undefined || assignedTo !== undefined) {
      ticket = await updateTicket(id, { status, assignedTo });
      if (!ticket) return apiError(404, "Ticket not found");
    }
    if (note !== undefined) {
      ticket = await addTicketNote(id, session.user.id, note);
      if (!ticket) return apiError(404, "Ticket not found");
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    return handleRouteError("admin/contacts/[id]", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    const deleted = await deleteTicket(id);
    if (!deleted) return apiError(404, "Ticket not found");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("admin/contacts/[id]", error);
  }
}
