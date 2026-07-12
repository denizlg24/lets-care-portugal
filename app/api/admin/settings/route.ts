import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { revalidateContactPaths } from "@/lib/contact/revalidate";
import { siteSettingsUpdateSchema } from "@/lib/settings/schemas";
import { getSiteSettings, updateSiteSettings } from "@/lib/settings/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError("admin/settings", error);
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Corpo JSON inválido");

    const parsed = siteSettingsUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const settings = await updateSiteSettings(parsed.data);
    revalidateContactPaths();

    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError("admin/settings", error);
  }
}
