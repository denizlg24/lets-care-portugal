import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { isValidObjectId } from "@/lib/blog/utils";
import { deleteMedia, MediaInUseError } from "@/lib/media/storage";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "Invalid media id");

    const deleted = await deleteMedia(id);
    if (!deleted) return apiError(404, "Media not found");

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MediaInUseError) {
      return apiError(409, error.message);
    }
    return handleRouteError("admin/media/[id]:DELETE", error);
  }
}
