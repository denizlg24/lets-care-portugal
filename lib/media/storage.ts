import { createHash } from "node:crypto";
import { GridFSBucket, ObjectId } from "mongodb";
import { db } from "@/lib/db/client";
import { connectMongoose } from "@/lib/db/mongoose";
import { Blog } from "@/models/Blog";
import { type ILeanMediaAsset, MediaAsset } from "@/models/MediaAsset";

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MB

// SVG is excluded on purpose: it can embed scripts and would be an XSS
// vector when served inline from our own origin.
export const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
]);

const BUCKET_NAME = "media";

function getBucket(): GridFSBucket {
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

export function mediaUrl(assetId: string): string {
  return `/api/media/${assetId}`;
}

export class MediaValidationError extends Error {}

function serializeAsset(asset: {
  _id: unknown;
  filename: string;
  contentType: string;
  size: number;
  sha256: string;
  gridFsId: unknown;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}): ILeanMediaAsset & { url: string } {
  const id = String(asset._id);
  return {
    _id: id,
    filename: asset.filename,
    contentType: asset.contentType,
    size: asset.size,
    sha256: asset.sha256,
    gridFsId: String(asset.gridFsId),
    uploadedBy: asset.uploadedBy,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    url: mediaUrl(id),
  };
}

/**
 * Stores an uploaded file in GridFS, deduplicated by content hash: if the
 * exact same bytes were uploaded before, the existing asset is returned and
 * nothing new is stored.
 */
export async function uploadMedia(
  file: File,
  uploadedBy?: string,
): Promise<ILeanMediaAsset & { url: string; deduplicated: boolean }> {
  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    throw new MediaValidationError(`Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_MEDIA_BYTES) {
    throw new MediaValidationError(
      `File is too large (max ${Math.floor(MAX_MEDIA_BYTES / (1024 * 1024))} MB)`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(buffer).digest("hex");

  await connectMongoose();

  const existing = await MediaAsset.findOne({ sha256 }).lean();
  if (existing) {
    return { ...serializeAsset(existing), deduplicated: true };
  }

  const bucket = getBucket();
  // The driver dropped the top-level contentType option; the type we serve
  // with comes from the MediaAsset document instead.
  const uploadStream = bucket.openUploadStream(file.name, {
    metadata: { sha256, contentType: file.type },
  });

  await new Promise<void>((resolve, reject) => {
    uploadStream.once("error", reject);
    uploadStream.once("finish", () => resolve());
    uploadStream.end(buffer);
  });

  try {
    const asset = await MediaAsset.create({
      filename: file.name,
      contentType: file.type,
      size: buffer.byteLength,
      sha256,
      gridFsId: uploadStream.id,
      uploadedBy,
    });
    return { ...serializeAsset(asset.toObject()), deduplicated: false };
  } catch (error) {
    // Concurrent upload of the same bytes lost the unique-index race:
    // drop our duplicate GridFS file and return the winner.
    await getBucket()
      .delete(uploadStream.id)
      .catch(() => {});
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
  assets: (ILeanMediaAsset & { url: string })[];
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

export interface MediaDownload {
  asset: ILeanMediaAsset;
  buffer: Buffer;
}

export async function getMediaById(id: string): Promise<MediaDownload | null> {
  await connectMongoose();
  const asset = await MediaAsset.findById(id).lean();
  if (!asset) return null;

  const bucket = getBucket();
  const chunks: Buffer[] = [];
  const download = bucket.openDownloadStream(new ObjectId(String(asset.gridFsId)));

  await new Promise<void>((resolve, reject) => {
    download.on("data", (chunk: Buffer) => chunks.push(chunk));
    download.once("error", reject);
    download.once("end", () => resolve());
  });

  return { asset: serializeAsset(asset), buffer: Buffer.concat(chunks) };
}

export class MediaInUseError extends Error {}

/**
 * Deletes an asset (metadata + GridFS bytes). Refuses when any blog still
 * references the asset URL as cover image or inline media.
 */
export async function deleteMedia(id: string): Promise<boolean> {
  await connectMongoose();
  const asset = await MediaAsset.findById(id).lean();
  if (!asset) return false;

  const url = mediaUrl(String(asset._id));
  const inUse = await Blog.exists({
    $or: [{ coverImage: url }, { media: url }],
  });
  if (inUse) {
    throw new MediaInUseError("Media is referenced by a blog post");
  }

  await getBucket()
    .delete(new ObjectId(String(asset.gridFsId)))
    .catch(() => {
      // Orphaned metadata should still be removable.
    });
  await MediaAsset.deleteOne({ _id: asset._id });
  return true;
}
