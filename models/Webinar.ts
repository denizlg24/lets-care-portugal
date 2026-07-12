import mongoose, { type Document, Schema } from "mongoose";

/**
 * A webinar hosted on the project's YouTube channel and curated by an admin.
 * Only the video id is stored — embed URLs and thumbnails are derived from it
 * at render time. Hidden (`visible: false`) until an admin publishes it.
 */
export interface IWebinar extends Document {
  youtubeId: string;
  title: string;
  publishedAt: Date;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanWebinar {
  _id: string;
  youtubeId: string;
  title: string;
  publishedAt: Date;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WebinarSchema = new Schema<IWebinar>(
  {
    youtubeId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    publishedAt: { type: Date, required: true },
    visible: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

WebinarSchema.index({ publishedAt: -1 });

export const Webinar: mongoose.Model<IWebinar> =
  mongoose.models.Webinar || mongoose.model<IWebinar>("Webinar", WebinarSchema);
