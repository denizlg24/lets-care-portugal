import mongoose, { type Document, Schema } from "mongoose";
import { RESOURCE_TYPES, type ResourceType } from "@/lib/resources/constants";

/**
 * A downloadable or linked resource on the public "Recursos" page: project
 * reports, scientific papers, policy briefs and pedagogic/interactive
 * materials (e.g. an HTML game). Every resource has a file in the external
 * storage service (`fileUrl` + `storageFileId`), an external link
 * (`externalUrl`, e.g. a DOI), or both. `thumbnailUrl` is a PNG of the first
 * PDF page rendered at upload time. Hidden (`visible: false`) until an admin
 * publishes it.
 */
export interface IResource extends Document {
  type: ResourceType;
  title: string;
  description?: string;
  authors?: string;
  publishedAt: Date;
  fileUrl?: string;
  storageFileId?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
  externalUrl?: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeanResource {
  _id: string;
  type: ResourceType;
  title: string;
  description?: string;
  authors?: string;
  publishedAt: Date;
  fileUrl?: string;
  storageFileId?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
  externalUrl?: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    type: { type: String, required: true, enum: RESOURCE_TYPES },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    authors: { type: String, trim: true },
    publishedAt: { type: Date, required: true },
    fileUrl: { type: String, trim: true },
    storageFileId: { type: String },
    fileSize: { type: Number },
    thumbnailUrl: { type: String, trim: true },
    thumbnailStorageFileId: { type: String },
    externalUrl: { type: String, trim: true },
    visible: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

ResourceSchema.index({ type: 1, publishedAt: -1 });

export const Resource: mongoose.Model<IResource> =
  mongoose.models.Resource || mongoose.model<IResource>("Resource", ResourceSchema);
