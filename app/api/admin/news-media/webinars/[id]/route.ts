import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { isValidObjectId } from "@/lib/blog/utils";
import { revalidateMediaPaths } from "@/lib/news-media/revalidate";
import { type WebinarUpdateInput, webinarUpdateSchema } from "@/lib/news-media/schemas";
import { deleteWebinar, updateWebinar } from "@/lib/news-media/service";
import { extractYouTubeId } from "@/lib/news-media/youtube";

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

    const parsed = webinarUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const { youtubeUrl, ...rest } = parsed.data;
    const input: WebinarUpdateInput = rest;
    if (youtubeUrl !== undefined) {
      const youtubeId = extractYouTubeId(youtubeUrl);
      if (!youtubeId) return apiError(400, "Link do YouTube inválido");
      input.youtubeId = youtubeId;
    }

    const item = await updateWebinar(id, input);
    if (!item) return apiError(404, "Webinar não encontrado");

    revalidateMediaPaths();
    return NextResponse.json({ item });
  } catch (error) {
    return handleRouteError("admin/news-media/webinars/[id]:PATCH", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID inválido");

    const deleted = await deleteWebinar(id);
    if (!deleted) return apiError(404, "Webinar não encontrado");

    revalidateMediaPaths();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("admin/news-media/webinars/[id]:DELETE", error);
  }
}
