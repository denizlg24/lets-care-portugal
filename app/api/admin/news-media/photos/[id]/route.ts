import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { isValidObjectId } from "@/lib/blog/utils";
import { projectPhotoUpdateSchema } from "@/lib/news-media/schemas";
import { deleteProjectPhoto, updateProjectPhoto } from "@/lib/news-media/service";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID inválido");

    const parsed = projectPhotoUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const item = await updateProjectPhoto(id, parsed.data);
    if (!item) return apiError(404, "Fotografia não encontrada");

    return NextResponse.json({ item });
  } catch (error) {
    return handleRouteError("admin/news-media/photos/[id]:PATCH", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID inválido");

    const deleted = await deleteProjectPhoto(id);
    if (!deleted) return apiError(404, "Fotografia não encontrada");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("admin/news-media/photos/[id]:DELETE", error);
  }
}
