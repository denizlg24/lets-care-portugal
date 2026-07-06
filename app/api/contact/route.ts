import { type NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/api/request-meta";
import {
  apiError,
  apiRateLimited,
  apiValidationError,
  handleRouteError,
} from "@/lib/api/responses";
import { contactCreateSchema } from "@/lib/contact/schemas";
import { createTicket, sendTicketConfirmation, ticketMetaFromRequest } from "@/lib/contact/service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { allowed, resetMs } = await checkRateLimit(`contact:${getClientIp(request)}`, {
      maxRequests: 3,
      windowMs: 600_000,
    });
    if (!allowed) return apiRateLimited(resetMs);

    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Invalid JSON body");

    const parsed = contactCreateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const ticket = await createTicket(parsed.data, ticketMetaFromRequest(request));

    // The ticket is already stored — a failed confirmation email must not
    // fail the request. `confirmationEmailSentAt` stays unset for retries.
    try {
      await sendTicketConfirmation(ticket);
    } catch (error) {
      console.error(`[api:contact] confirmation email failed for ${ticket.ticketId}:`, error);
    }

    return NextResponse.json(
      {
        ticketId: ticket.ticketId,
        message: "Your message has been received. A confirmation email is on its way.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError("contact", error);
  }
}
