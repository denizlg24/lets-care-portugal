import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, apiValidationError, handleRouteError } from "@/lib/api/responses";
import { blogUpdateSchema } from "@/lib/blog/schemas";
import { deleteBlog, getBlogById, getBlogViews, updateBlog } from "@/lib/blog/service";
import { isValidObjectId } from "@/lib/blog/utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "Invalid blog id");

    const blog = await getBlogById(id);
    if (!blog) return apiError(404, "Blog not found");

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
    if (!isValidObjectId(id)) return apiError(400, "Invalid blog id");

    const parsed = blogUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return apiValidationError(parsed.error);

    const blog = await updateBlog(id, parsed.data);
    if (!blog) return apiError(404, "Blog not found");

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
    if (!isValidObjectId(id)) return apiError(400, "Invalid blog id");

    const deleted = await deleteBlog(id);
    if (!deleted) return apiError(404, "Blog not found");

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError("admin/blogs/[id]:DELETE", error);
  }
}
