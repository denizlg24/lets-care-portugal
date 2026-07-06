import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/api/request-meta";
import {
  apiError,
  apiRateLimited,
  apiValidationError,
  handleRouteError,
} from "@/lib/api/responses";
import { CommentTargetError, createComment, listPublicComments } from "@/lib/blog/comments";
import { commentCreateSchema, objectIdSchema } from "@/lib/blog/schemas";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const blogId = objectIdSchema.safeParse(searchParams.get("blogId"));
    if (!blogId.success) return apiError(400, "A valid blogId is required");

    const parentIdRaw = searchParams.get("parentId");
    const parentId = parentIdRaw ? objectIdSchema.safeParse(parentIdRaw) : null;
    if (parentId && !parentId.success) return apiError(400, "Invalid parentId");

    const comments = await listPublicComments({
      blogId: blogId.data,
      parentId: parentId?.data,
      sessionId: searchParams.get("sessionId") ?? undefined,
    });

    return NextResponse.json({ comments });
  } catch (error) {
    return handleRouteError("blog/comments:GET", error);
  }
}

/** Submits a comment; it stays hidden until an admin approves it. */
export async function POST(request: NextRequest) {
  try {
    const { allowed, resetMs } = await checkRateLimit(`comment:${getClientIp(request)}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!allowed) return apiRateLimited(resetMs);

    const parsed = commentCreateSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const comment = await createComment(parsed.data);
    return NextResponse.json(
      {
        message: "Comment submitted. It will appear once approved by a moderator.",
        comment,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CommentTargetError) {
      return apiError(404, error.message);
    }
    return handleRouteError("blog/comments:POST", error);
  }
}
