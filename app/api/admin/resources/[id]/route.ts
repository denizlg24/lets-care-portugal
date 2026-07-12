import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { isValidObjectId } from "@/lib/blog/utils";
import { revalidateResourcePaths } from "@/lib/resources/revalidate";
import { resourceUpdateSchema } from "@/lib/resources/schemas";
import { deleteResource, updateResource } from "@/lib/resources/service";

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

    const parsed = resourceUpdateSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const item = await updateResource(id, parsed.data);
    if (!item) return apiError(404, "Recurso não encontrado");

    revalidateResourcePaths();
    return NextResponse.json({ item });
  } catch (error) {
    return handleRouteError("admin/resources/[id]:PATCH", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID inválido");

    const deleted = await deleteResource(id);
    if (!deleted) return apiError(404, "Recurso não encontrado");

    revalidateResourcePaths();
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("admin/resources/[id]:DELETE", error);
  }
}
