import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { getCommentModerationHistory } from "@/lib/blog/comments";
import { commentIdParamsSchema, commentLogQuerySchema } from "@/lib/blog/schemas";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const parsedParams = commentIdParamsSchema.safeParse(await params);
    if (!parsedParams.success) return apiValidationError(parsedParams.error);

    const { searchParams } = new URL(request.url);
    const parsedQuery = commentLogQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsedQuery.success) return apiValidationError(parsedQuery.error);

    const entries = await getCommentModerationHistory(parsedParams.data.id, parsedQuery.data);
    if (!entries) return apiError(404, "Comentário não encontrado");

    return NextResponse.json({ entries });
  } catch (error) {
    return handleRouteError("admin/comments/[id]/log:GET", error);
  }
}
