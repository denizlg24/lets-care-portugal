import mongoose, { type Document, Schema } from "mongoose";
import { LEGAL_SLUGS, type LegalSlug } from "@/lib/legal/constants";

/**
 * An admin-edited legal page (privacy, terms, cookies, accessibility). Only
 * pages the team has actually saved exist as documents; the public pages fall
 * back to the bundled defaults in `lib/legal/defaults` otherwise.
 */
export interface ILegalPage extends Document {
  slug: LegalSlug;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const LegalPageSchema = new Schema<ILegalPage>(
  {
    slug: { type: String, required: true, enum: LEGAL_SLUGS, unique: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

export const LegalPage: mongoose.Model<ILegalPage> =
  mongoose.models.LegalPage || mongoose.model<ILegalPage>("LegalPage", LegalPageSchema);
