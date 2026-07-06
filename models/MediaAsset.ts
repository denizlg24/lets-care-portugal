import mongoose, { type Document, Schema, type Types } from "mongoose";

/**
 * Metadata for a file stored in the MongoDB GridFS "media" bucket. Assets
 * are deduplicated by content hash: uploading the same bytes twice returns
 * the existing asset instead of storing a second copy.
 *
 * The binary itself is served from `/api/media/[id]` with immutable cache
 * headers (content-addressed assets never change, so CDNs can cache them
 * indefinitely).
 */
export interface IMediaAsset extends Document {
  filename: string;
  contentType: string;
  size: number;
  sha256: string;
  gridFsId: Types.ObjectId;
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
  gridFsId: string;
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
    gridFsId: { type: Schema.Types.ObjectId, required: true },
    uploadedBy: { type: String, trim: true },
  },
  { timestamps: true },
);

MediaAssetSchema.index({ createdAt: -1 });

export const MediaAsset: mongoose.Model<IMediaAsset> =
  mongoose.models.MediaAsset || mongoose.model<IMediaAsset>("MediaAsset", MediaAssetSchema);
