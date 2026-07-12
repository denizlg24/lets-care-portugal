import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiValidationError, handleRouteError } from "@/lib/api/responses";
import { getCommentStats, listCommentBlogOptions, listCommentsAdmin } from "@/lib/blog/comments";
import { commentListQuerySchema } from "@/lib/blog/schemas";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = commentListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) return apiValidationError(parsed.error);

    const [result, stats, blogs] = await Promise.all([
      listCommentsAdmin(parsed.data),
      getCommentStats(),
      listCommentBlogOptions(),
    ]);

    return NextResponse.json({ ...result, stats, blogs });
  } catch (error) {
    return handleRouteError("admin/comments:GET", error);
  }
}
