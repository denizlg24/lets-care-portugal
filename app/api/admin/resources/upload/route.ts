import { type NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/admin";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { renderPdfThumbnail } from "@/lib/news-media/pdf-thumbnail";
import { renderHtmlThumbnail } from "@/lib/resources/html-thumbnail";
import { uploadFileToStorage } from "@/lib/storage/api";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 1000 * 1024 * 1024; // 1 GB
const HTML_TYPES = new Set(["text/html", "application/xhtml+xml"]);

/**
 * Uploader for the resources admin area. Accepts a PDF (reports, papers,
 * policy briefs) or a standalone HTML file (interactive pedagogic materials,
 * e.g. a game), stores it, and returns the public URL plus the storage id so
 * the record can later delete the file. Both kinds get a cover thumbnail
 * rendered and stored (best-effort): the first page for PDFs, a headless-
 * browser capture for HTML. HTML is served from the storage service's origin,
 * so its scripts never run on this site's domain.
 */
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(request);
  if (response) return response;

  // Reject oversized uploads before buffering the whole multipart body. This is
  // a best-effort guard (the header can be absent/spoofed); `file.size` below is
  // the authoritative check, and a server/proxy body limit should back it up.
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    return apiError(413, "O ficheiro é demasiado grande (máx. 1 GB)");
  }

  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return apiError(400, "Nenhum ficheiro enviado");
    }

    const isPdf = file.type === "application/pdf";
    const isHtml = HTML_TYPES.has(file.type) || /\.html?$/i.test(file.name);
    if (!isPdf && !isHtml) {
      return apiError(400, `Tipo de ficheiro não suportado: ${file.type || "desconhecido"}`);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return apiError(400, "O ficheiro é demasiado grande (máx. 1 GB)");
    }

    const stored = await uploadFileToStorage(file, "file");

    const png = isPdf
      ? await renderPdfThumbnail(Buffer.from(await file.arrayBuffer()))
      : await renderHtmlThumbnail(await file.text());

    let thumbnail: { url: string; storageFileId: string } | undefined;
    if (png) {
      try {
        const thumbName = `${file.name.replace(/\.(pdf|html?)$/i, "") || "recurso"}-capa.png`;
        const thumbFile = new File([new Uint8Array(png)], thumbName, { type: "image/png" });
        const storedThumb = await uploadFileToStorage(thumbFile, "image");
        thumbnail = { url: storedThumb.publicUrl, storageFileId: storedThumb.id };
      } catch (error) {
        // The resource is still usable without a cover, so never fail the
        // upload over the thumbnail.
        console.error("[resources] failed to store thumbnail", error);
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
    return handleRouteError("admin/resources/upload:POST", error);
  }
}
