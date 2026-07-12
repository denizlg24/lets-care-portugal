import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { CommentActionError, deleteComment, moderateComment } from "@/lib/blog/comments";
import { commentIdParamsSchema, commentModerationSchema } from "@/lib/blog/schemas";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const parsedParams = commentIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) return apiValidationError(parsedParams.error);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, "Corpo do pedido inválido");
    }

    const parsed = commentModerationSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const comment = await moderateComment(parsedParams.data.id, parsed.data.action, {
      id: session.user.id,
      name: session.user.name,
    });
    if (!comment) return apiError(404, "Comentário não encontrado");

    return NextResponse.json({ comment });
  } catch (error) {
    if (error instanceof CommentActionError) {
      return apiError(error.status, error.message);
    }
    return handleRouteError("admin/comments/[id]:PATCH", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const parsedParams = commentIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) return apiValidationError(parsedParams.error);

    const result = await deleteComment(parsedParams.data.id, {
      id: session.user.id,
      name: session.user.name,
    });
    if (!result) return apiError(404, "Comentário não encontrado");

    return NextResponse.json({ success: true, softDeleted: result.softDeleted });
  } catch (error) {
    if (error instanceof CommentActionError) {
      return apiError(error.status, error.message);
    }
    return handleRouteError("admin/comments/[id]:DELETE", error);
  }
}
