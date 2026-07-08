import mongoose, { type Document, Schema } from "mongoose";

/**
 * A single project photo shown in the public dome gallery. `subtitle` and
 * `takenAt` are both optional captions. The image lives in the external
 * storage service; `storageFileId` is kept so the file can be removed from
 * storage when the photo is deleted. Hidden (`visible: false`) until an admin
 * publishes it.
 */
export interface IProjectPhoto extends Document {
  imageUrl: string;
  storageFileId: string;
  subtitle?: string;
  takenAt?: Date;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanProjectPhoto {
  _id: string;
  imageUrl: string;
  storageFileId: string;
  subtitle?: string;
  takenAt?: Date;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectPhotoSchema = new Schema<IProjectPhoto>(
  {
    imageUrl: { type: String, required: true, trim: true },
    storageFileId: { type: String, required: true },
    subtitle: { type: String, trim: true },
    takenAt: { type: Date },
    visible: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

ProjectPhotoSchema.index({ createdAt: -1 });

export const ProjectPhoto: mongoose.Model<IProjectPhoto> =
  mongoose.models.ProjectPhoto || mongoose.model<IProjectPhoto>("ProjectPhoto", ProjectPhotoSchema);
