import mongoose, { type Document, Schema } from "mongoose";

/**
 * A news entry shown on the public "Notícias e Media" page: an image, a title,
 * a short description, a date, and an external link to read the full story
 * elsewhere. The image lives in the external storage service; `storageFileId`
 * is kept so the file can be removed from storage when the entry is deleted.
 * Hidden (`visible: false`) until an admin publishes it.
 */
export interface INewsItem extends Document {
  imageUrl: string;
  storageFileId: string;
  title: string;
  description: string;
  date: Date;
  externalUrl: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanNewsItem {
  _id: string;
  imageUrl: string;
  storageFileId: string;
  title: string;
  description: string;
  date: Date;
  externalUrl: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsItemSchema = new Schema<INewsItem>(
  {
    imageUrl: { type: String, required: true, trim: true },
    storageFileId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    externalUrl: { type: String, required: true, trim: true },
    visible: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

NewsItemSchema.index({ date: -1 });

export const NewsItem: mongoose.Model<INewsItem> =
  mongoose.models.NewsItem || mongoose.model<INewsItem>("NewsItem", NewsItemSchema);
