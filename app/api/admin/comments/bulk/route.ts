import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { applyBulkCommentAction } from "@/lib/blog/comments";
import { commentBulkActionSchema } from "@/lib/blog/schemas";

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, "Corpo do pedido inválido");
    }

    const parsed = commentBulkActionSchema.safeParse(body);
    if (!parsed.success) return apiValidationError(parsed.error);

    const result = await applyBulkCommentAction(parsed.data, {
      id: session.user.id,
      name: session.user.name,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError("admin/comments/bulk:POST", error);
  }
}
