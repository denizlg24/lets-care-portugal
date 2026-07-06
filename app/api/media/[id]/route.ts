import type { NextRequest } from "next/server";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { isValidObjectId } from "@/lib/blog/utils";
import { getMediaById } from "@/lib/media/storage";

export const runtime = "nodejs";

/**
 * Serves a media asset from GridFS. Assets are content-addressed (uploads
 * are deduplicated by hash and never mutated), so responses are immutable
 * and CDN-cacheable for a year.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(400, "Invalid media id");

    const etag = `"${id}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304 });
    }

    const media = await getMediaById(id);
    if (!media) return apiError(404, "Media not found");

    return new Response(new Uint8Array(media.buffer), {
      status: 200,
      headers: {
        "Content-Type": media.asset.contentType,
        "Content-Length": String(media.asset.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${encodeURIComponent(media.asset.filename)}"`,
        ETag: etag,
      },
    });
  } catch (error) {
    return handleRouteError("media/[id]:GET", error);
  }
}
