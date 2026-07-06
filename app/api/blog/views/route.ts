import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/api/request-meta";
import { apiError, apiRateLimited, handleRouteError } from "@/lib/api/responses";
import { objectIdSchema } from "@/lib/blog/schemas";
import { getBlogViews, incrementBlogViews } from "@/lib/blog/service";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blogId = objectIdSchema.safeParse(searchParams.get("blogId"));
    if (!blogId.success) return apiError(400, "É necessário um blogId válido");

    const views = await getBlogViews(blogId.data);
    return NextResponse.json({ views });
  } catch (error) {
    return handleRouteError("blog/views:GET", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { allowed, resetMs } = await checkRateLimit(`view:${getClientIp(request)}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!allowed) return apiRateLimited(resetMs);

    const body = await request.json();
    const blogId = objectIdSchema.safeParse(body?.blogId);
    if (!blogId.success) return apiError(400, "É necessário um blogId válido");

    const views = await incrementBlogViews(blogId.data);
    return NextResponse.json({ views });
  } catch (error) {
    return handleRouteError("blog/views:POST", error);
  }
}
