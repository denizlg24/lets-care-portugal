import mongoose, { type Document, Schema } from "mongoose";

/**
 * Metadata for a file stored in the external storage service (see
 * `lib/storage/api.ts`). Assets are deduplicated by content hash: uploading
 * the same bytes twice returns the existing asset instead of storing a
 * second copy. `url` is the permanent public share URL served by the
 * storage service; blog posts reference assets by this URL.
 */
export interface IMediaAsset extends Document {
  filename: string;
  contentType: string;
  size: number;
  sha256: string;
  storageFileId: string;
  url: string;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanMediaAsset {
  _id: string;
  filename: string;
  contentType: string;
  size: number;
  sha256: string;
  storageFileId: string;
  url: string;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaAssetSchema = new Schema<IMediaAsset>(
  {
    filename: { type: String, required: true, trim: true },
    contentType: { type: String, required: true, trim: true },
    size: { type: Number, required: true },
    sha256: { type: String, required: true, unique: true },
    storageFileId: { type: String, required: true },
    url: { type: String, required: true, trim: true },
    uploadedBy: { type: String, trim: true },
  },
  { timestamps: true },
);

MediaAssetSchema.index({ createdAt: -1 });

export const MediaAsset: mongoose.Model<IMediaAsset> =
  mongoose.models.MediaAsset || mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);
