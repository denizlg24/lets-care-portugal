import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { revalidateSiteConfig } from "@/lib/settings/revalidate";
import { siteConfigUpdateSchema } from "@/lib/settings/schemas";
import { getSiteConfig, updateSiteConfig } from "@/lib/settings/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const config = await getSiteConfig();
    return NextResponse.json({ config });
  } catch (error) {
    return handleRouteError("admin/site-config", error);
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Corpo JSON inválido");

    const parsed = siteConfigUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const config = await updateSiteConfig(parsed.data);
    revalidateSiteConfig();

    return NextResponse.json({ config });
  } catch (error) {
    return handleRouteError("admin/site-config", error);
  }
}
