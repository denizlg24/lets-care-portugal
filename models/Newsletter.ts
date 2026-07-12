import mongoose, { type Document, Schema } from "mongoose";

/**
 * A PDF newsletter made available for download on the public "Notícias e
 * Media" page. The PDF lives in the external storage service; `fileUrl` is its
 * permanent public URL and `storageFileId` is kept so the file can be removed
 * from storage when the newsletter is deleted. `thumbnailUrl` is a PNG of the
 * first page rendered at upload time (absent for PDFs that failed to render).
 * Hidden (`visible: false`) until an admin publishes it.
 */
export interface INewsletter extends Document {
  title: string;
  publishedAt: Date;
  fileUrl: string;
  storageFileId: string;
  fileSize?: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanNewsletter {
  _id: string;
  title: string;
  publishedAt: Date;
  fileUrl: string;
  storageFileId: string;
  fileSize?: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSchema = new Schema<INewsletter>(
  {
    title: { type: String, required: true, trim: true },
    publishedAt: { type: Date, required: true },
    fileUrl: { type: String, required: true, trim: true },
    storageFileId: { type: String, required: true },
    fileSize: { type: Number },
    thumbnailUrl: { type: String, trim: true },
    thumbnailStorageFileId: { type: String },
    visible: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

NewsletterSchema.index({ publishedAt: -1 });

export const Newsletter: mongoose.Model<INewsletter> =
  mongoose.models.Newsletter || mongoose.model<INewsletter>("Newsletter", NewsletterSchema);
