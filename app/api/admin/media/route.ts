import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { listMedia, MediaValidationError, uploadMedia } from "@/lib/media/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));

    const result = await listMedia({ page, limit });
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError("admin/media:GET", error);
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin(request);
  if (response) return response;

  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return apiError(400, "No file provided");
    }

    const asset = await uploadMedia(file, session.user.id);
    return NextResponse.json({ asset }, { status: asset.deduplicated ? 200 : 201 });
  } catch (error) {
    if (error instanceof MediaValidationError) {
      return apiError(400, error.message);
    }
    return handleRouteError("admin/media:POST", error);
  }
}
