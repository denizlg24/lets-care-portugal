import mongoose, { type Document, Schema } from "mongoose";

/**
 * A configurable public link. `icon` holds a `react-icons/fa6` export name
 * (e.g. "FaFacebook") resolved at render time via `lib/icons/registry`.
 * `value` is the visible text for contact links (email address, phone number);
 * social links render the `label` only.
 */
export interface ISiteLink {
  icon: string;
  label: string;
  value?: string;
  href: string;
}

export interface ISiteSettings extends Document {
  key: "site";
  socialLinks: ISiteLink[];
  contactLinks: ISiteLink[];
  createdAt: Date;
  updatedAt: Date;
}

const SiteLinkSchema = new Schema<ISiteLink>(
  {
    icon: { type: String, required: true, trim: true, maxlength: 64 },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, trim: true, maxlength: 160 },
    href: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false },
);

// Singleton document, addressed by the fixed `key`.
const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    socialLinks: { type: [SiteLinkSchema], default: [] },
    contactLinks: { type: [SiteLinkSchema], default: [] },
  },
  { timestamps: true },
);

export const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
