import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { getBlogViews, getPublishedBlogBySlug } from "@/lib/blog/service";

/** Public detail of a published post, by slug. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const blog = await getPublishedBlogBySlug(slug);
    if (!blog) return apiError(404, "Blog not found");

    const views = await getBlogViews(blog._id);
    return NextResponse.json({ blog, views });
  } catch (error) {
    return handleRouteError("blog/[slug]:GET", error);
  }
}
