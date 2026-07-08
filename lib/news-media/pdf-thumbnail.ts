import "server-only";

const THUMBNAIL_SCALE = 2;

/**
 * Renders the first page of a PDF to a PNG buffer for use as a newsletter
 * cover thumbnail. Returns null when rendering fails — a newsletter without a
 * thumbnail is preferable to a failed upload.
 */
export async function renderPdfThumbnail(data: Buffer): Promise<Buffer | null> {
  try {
    const { pdf } = await import("pdf-to-img");
    const document = await pdf(data, { scale: THUMBNAIL_SCALE });
    return await document.getPage(1);
  } catch (error) {
    console.error("[news-media] failed to render PDF thumbnail", error);
    return null;
  }
}
