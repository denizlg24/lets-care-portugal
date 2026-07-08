import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { isValidObjectId } from "@/lib/blog/utils";
import { newsletterUpdateSchema } from "@/lib/news-media/schemas";
import { deleteNewsletter, updateNewsletter } from "@/lib/news-media/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID inválido");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, "Corpo do pedido inválido");
    }

    const parsed = newsletterUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const item = await updateNewsletter(id, parsed.data);
    if (!item) return apiError(404, "Newsletter não encontrado");

    return NextResponse.json({ item });
  } catch (error) {
    return handleRouteError("admin/news-media/newsletters/[id]:PATCH", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID inválido");

    const deleted = await deleteNewsletter(id);
    if (!deleted) return apiError(404, "Newsletter não encontrado");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("admin/news-media/newsletters/[id]:DELETE", error);
  }
}
