import { type NextRequest, NextResponse } from "next/server";
import { revalidateAboutPaths } from "@/lib/about/revalidate";
import { aboutSettingsUpdateSchema } from "@/lib/about/schemas";
import { getAboutSettings, updateAboutSettings } from "@/lib/about/service";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const settings = await getAboutSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError("admin/about", error);
  }
}

export async function PUT(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return apiError(400, "Corpo JSON inválido");

    const parsed = aboutSettingsUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const settings = await updateAboutSettings(parsed.data);
    revalidateAboutPaths();

    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError("admin/about", error);
  }
}
