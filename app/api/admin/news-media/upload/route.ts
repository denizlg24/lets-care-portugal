import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { renderPdfThumbnail } from "@/lib/news-media/pdf-thumbnail";
import { uploadFileToStorage } from "@/lib/storage/api";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

/**
 * Shared uploader for the news & media admin area. Accepts an image (photos,
 * news) or a PDF (newsletters), stores it, and returns the public URL plus the
 * storage id so the record can later delete the file. PDFs additionally get
 * their first page rendered and stored as a cover thumbnail (best-effort).
 * SVG is rejected on purpose (script/XSS vector when served inline).
 */
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  // Reject oversized uploads before buffering the whole multipart body. This is
  // a best-effort guard (the header can be absent/spoofed); `file.size` below is
  // the authoritative check, and a server/proxy body limit should back it up.
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return apiError(413, "O ficheiro é demasiado grande (máx. 10 MB)");
  }

  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return apiError(400, "Nenhum ficheiro enviado");
    }

    const isImage = IMAGE_TYPES.has(file.type);
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      return apiError(400, `Tipo de ficheiro não suportado: ${file.type || "desconhecido"}`);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return apiError(400, "O ficheiro é demasiado grande (máx. 10 MB)");
    }

    const stored = await uploadFileToStorage(file, isImage ? "image" : "file");

    let thumbnail: { url: string; storageFileId: string } | undefined;
    if (isPdf) {
      const png = await renderPdfThumbnail(Buffer.from(await file.arrayBuffer()));
      if (png) {
        try {
          const thumbName = `${file.name.replace(/\.pdf$/i, "") || "newsletter"}-capa.png`;
          const thumbFile = new File([new Uint8Array(png)], thumbName, { type: "image/png" });
          const storedThumb = await uploadFileToStorage(thumbFile, "image");
          thumbnail = { url: storedThumb.publicUrl, storageFileId: storedThumb.id };
        } catch (error) {
          // The newsletter is still usable without a cover, so never fail the
          // upload over the thumbnail.
          console.error("[news-media] failed to store PDF thumbnail", error);
        }
      }
    }

    return NextResponse.json({
      url: stored.publicUrl,
      storageFileId: stored.id,
      size: stored.sizeBytes,
      thumbnailUrl: thumbnail?.url,
      thumbnailStorageFileId: thumbnail?.storageFileId,
    });
  } catch (error) {
    return handleRouteError("admin/news-media/upload:POST", error);
  }
}
