import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { notificationEmailsUpdateSchema } from "@/lib/settings/schemas";
import { getNotificationEmails, updateNotificationEmails } from "@/lib/settings/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const notificationEmails = await getNotificationEmails();
    return NextResponse.json({ notificationEmails });
  } catch (error) {
    return handleRouteError("admin/contact-notifications", error);
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Corpo JSON inválido");

    const parsed = notificationEmailsUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const notificationEmails = await updateNotificationEmails(parsed.data);
    return NextResponse.json({ notificationEmails });
  } catch (error) {
    return handleRouteError("admin/contact-notifications", error);
  }
}
