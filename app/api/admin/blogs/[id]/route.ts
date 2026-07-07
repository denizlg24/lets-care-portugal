import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { revalidateBlogPaths } from "@/lib/blog/revalidate";
import { blogUpdatePatchSchema, blogUpdateSchema } from "@/lib/blog/schemas";
import { deleteBlog, getBlogById, getBlogViews, updateBlog } from "@/lib/blog/service";
import { isValidObjectId } from "@/lib/blog/utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID de artigo inválido");

    const blog = await getBlogById(id);
    if (!blog) return apiError(404, "Artigo não encontrado");

    const views = await getBlogViews(id);
    return NextResponse.json({ blog, views });
  } catch (error) {
    return handleRouteError("admin/blogs/[id]:GET", error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID de artigo inválido");

    const previous = await getBlogById(id);
    if (!previous) return apiError(404, "Artigo não encontrado");

    const parsed = blogUpdatePatchSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const publishState = blogUpdateSchema.safeParse({
      status: parsed.data.status ?? previous.status,
      excerpt: parsed.data.excerpt ?? previous.excerpt,
      content: parsed.data.content ?? previous.content,
    });
    if (!publishState.success) return apiValidationError(publishState.error);

    const blog = await updateBlog(id, parsed.data);
    if (!blog) return apiError(404, "Artigo não encontrado");

    // Refresh public caches whenever the post is (or was) published — covers
    // slug renames, publish/unpublish, and content edits.
    if (previous.status === "published" || blog.status === "published") {
      revalidateBlogPaths(previous.slug, blog.slug);
    }

    return NextResponse.json({ blog });
  } catch (error) {
    return handleRouteError("admin/blogs/[id]:PATCH", error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "ID de artigo inválido");

    const existing = await getBlogById(id);
    const deleted = await deleteBlog(id);
    if (!deleted) return apiError(404, "Artigo não encontrado");

    if (existing?.status === "published") revalidateBlogPaths(existing.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("admin/blogs/[id]:DELETE", error);
  }
}
