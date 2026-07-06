import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/responses";
import { listPublishedBlogs } from "@/lib/blog/service";

/** Public listing of published posts (without full content bodies). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 12));

    const result = await listPublishedBlogs({
      tag: searchParams.get("tag") ?? undefined,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError("blog:GET", error);
  }
}
