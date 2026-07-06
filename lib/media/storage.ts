import { createHash } from "node:crypto";
import { connectMongoose } from "@/lib/db/mongoose";
import { deleteFileFromStorage, uploadFileToStorage } from "@/lib/storage/api";
import { Blog } from "@/models/Blog";
import { type ILeanMediaAsset, MediaAsset } from "@/models/MediaAsset";

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MB

// SVG is excluded on purpose: it can embed scripts and would be an XSS
// vector when served inline.
export const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
]);

export class MediaValidationError extends Error {}
export class MediaInUseError extends Error {}

function serializeAsset(asset: object): ILeanMediaAsset {
  const doc = asset as ILeanMediaAsset & { _id: unknown };
  return { ...doc, _id: String(doc._id) };
}

/**
 * Uploads a file to the storage service, deduplicated by content hash: if
 * the exact same bytes were uploaded before, the existing asset is returned
 * and nothing new is stored remotely.
 */
export async function uploadMedia(
  file: File,
  uploadedBy?: string,
): Promise<ILeanMediaAsset & { deduplicated: boolean }> {
  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    throw new MediaValidationError(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new MediaValidationError(
      `File is too large (max ${Math.floor(MAX_MEDIA_BYTES / (1024 * 1024))} MB)`,
    );
  }

  const sha256 = createHash("sha256")
    .update(Buffer.from(await file.arrayBuffer()))
    .digest("hex");

  await connectMongoose();

  const existing = await MediaAsset.findOne({ sha256 }).lean();
  if (existing) {
    return { ...serializeAsset(existing), deduplicated: true };
  }

  const stored = await uploadFileToStorage(file, file.type.startsWith("image/") ? "image" : "file");

  try {
    const asset = await MediaAsset.create({
      filename: stored.filename,
      contentType: file.type,
      size: stored.sizeBytes,
      sha256,
      storageFileId: stored.id,
      url: stored.publicUrl,
      uploadedBy,
    });
    return { ...serializeAsset(asset.toObject()), deduplicated: false };
  } catch (error) {
    // Concurrent upload of the same bytes lost the unique-index race:
    // drop our remote copy and return the winner.
    await deleteFileFromStorage(stored.id).catch(() => {});
    const winner = await MediaAsset.findOne({ sha256 }).lean();
    if (winner) {
      return { ...serializeAsset(winner), deduplicated: true };
    }
    throw error;
  }
}

export async function listMedia({
  page = 1,
  limit = 50,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<{
  assets: ILeanMediaAsset[];
  total: number;
  page: number;
  pages: number;
}> {
  await connectMongoose();
  const [assets, total] = await Promise.all([
    MediaAsset.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    MediaAsset.countDocuments(),
  ]);
  return {
    assets: assets.map(serializeAsset),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

/**
 * Deletes an asset (remote file + metadata). Refuses when any blog still
 * references the asset URL as cover image or inline media. The metadata
 * document is only removed after the remote delete succeeds, so a failed
 * remote call stays visible and retryable.
 */
export async function deleteMedia(id: string): Promise<boolean> {
  await connectMongoose();
  const asset = await MediaAsset.findById(id).lean();
  if (!asset) return false;

  const inUse = await Blog.exists({
    $or: [{ coverImage: asset.url }, { media: asset.url }],
  });
  if (inUse) {
    throw new MediaInUseError("Media is referenced by a blog post");
  }

  await deleteFileFromStorage(asset.storageFileId);
  await MediaAsset.deleteOne({ _id: asset._id });
  return true;
}
