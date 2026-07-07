import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiValidationError, handleRouteError } from "@/lib/api/responses";
import { revalidateBlogPaths } from "@/lib/blog/revalidate";
import { blogCreateSchema } from "@/lib/blog/schemas";
import { createBlog, getAllBlogViews, listBlogsAdmin } from "@/lib/blog/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));

    const [result, views] = await Promise.all([
      listBlogsAdmin({
        status: searchParams.get("status") ?? undefined,
        tag: searchParams.get("tag") ?? undefined,
        search: searchParams.get("q") ?? undefined,
        page,
        limit,
      }),
      getAllBlogViews(),
    ]);

    return NextResponse.json({ ...result, views });
  } catch (error) {
    return handleRouteError("admin/blogs:GET", error);
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const parsed = blogCreateSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const blog = await createBlog(parsed.data, session.user.id);
    // Only a published post is visible publicly; drafts don't affect the cache.
    if (blog.status === "published") revalidateBlogPaths(blog.slug);
    return NextResponse.json({ blog }, { status: 201 });
  } catch (error) {
    return handleRouteError("admin/blogs:POST", error);
  }
}
