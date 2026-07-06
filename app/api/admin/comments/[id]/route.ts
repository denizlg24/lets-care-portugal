import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { deleteComment, moderateComment } from "@/lib/blog/comments";
import { commentModerationSchema } from "@/lib/blog/schemas";
import { isValidObjectId } from "@/lib/blog/utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID de comentário inválido");

    const parsed = commentModerationSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const comment = await moderateComment(id, parsed.data.action, session.user.id);
    if (!comment) return apiError(404, "Comentário não encontrado");

    return NextResponse.json({ comment });
  } catch (error) {
    return handleRouteError("admin/comments/[id]:PATCH", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID de comentário inválido");

    const result = await deleteComment(id);
    if (!result) return apiError(404, "Comentário não encontrado");

    return NextResponse.json({ success: true, softDeleted: result.softDeleted });
  } catch (error) {
    return handleRouteError("admin/comments/[id]:DELETE", error);
  }
}
