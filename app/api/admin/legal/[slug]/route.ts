import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { LEGAL_SLUGS, type LegalSlug } from "@/lib/legal/constants";
import { revalidateLegalPath } from "@/lib/legal/revalidate";
import { legalPageUpdateSchema } from "@/lib/legal/schemas";
import { updateLegalPage } from "@/lib/legal/service";

type RouteParams = { params: Promise<{ slug: string }> };

function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { slug } = await params;
    if (!isLegalSlug(slug)) return apiError(404, "Página não encontrada");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, "Corpo do pedido inválido");
    }

    const parsed = legalPageUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const item = await updateLegalPage(slug, parsed.data);
    revalidateLegalPath(slug);
    return NextResponse.json({ item });
  } catch (error) {
    return handleRouteError("admin/legal/[slug]:PATCH", error);
  }
}
