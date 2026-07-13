import { type NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/api/request-meta";
import {
  apiError,
  apiRateLimited,
  apiValidationError,
  handleRouteError,
} from "@/lib/api/responses";
import { contactCreateSchema } from "@/lib/contact/schemas";
import {
  createTicket,
  sendTicketConfirmation,
  sendTicketNotification,
  ticketMetaFromRequest,
} from "@/lib/contact/service";
import { checkRateLimit } from "@/lib/rate-limit";
import { getNotificationEmails } from "@/lib/settings/service";

export async function POST(request: NextRequest) {
  try {
    const { allowed, resetMs } = await checkRateLimit(`contact:${getClientIp(request)}`, {
      maxRequests: 3,
      windowMs: 600_000,
    });
    if (!allowed) return apiRateLimited(resetMs);

    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Corpo JSON inválido");

    const parsed = contactCreateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const ticket = await createTicket(parsed.data, ticketMetaFromRequest(request));

    // The ticket is already stored: a confirmation email failure should not
    // fail the request. `confirmationEmailSentAt` stays empty for retries.
    try {
      await sendTicketConfirmation(ticket);
    } catch (error) {
      console.error(`[api:contact] falha no email de confirmação de ${ticket.ticketId}:`, error);
    }

    // Internal notifications are best-effort and never fail the request.
    try {
      const recipients = await getNotificationEmails();
      await sendTicketNotification(ticket, recipients);
    } catch (error) {
      console.error(`[api:contact] falha nas notificações de ${ticket.ticketId}:`, error);
    }

    return NextResponse.json(
      {
        ticketId: ticket.ticketId,
        message: "A sua mensagem foi recebida. O email de confirmação será enviado em breve.",
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError("contact", error);
  }
}
