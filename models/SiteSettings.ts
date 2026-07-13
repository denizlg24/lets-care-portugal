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
  /**
   * Site identity used in metadata and the footer. Empty `name` means the
   * config was never saved and `DEFAULT_SITE_CONFIG` in `lib/settings/defaults`
   * applies wholesale; after the first save, empty optional fields hide the
   * matching footer element.
   */
  name: string;
  shortName: string;
  title: string;
  description: string;
  consortiumText: string;
  consortiumHref: string;
  projectLine: string;
  fundingDisclaimer: string;
  /**
   * Internal addresses notified when a new contact ticket arrives. Server-only:
   * never returned by the public `getSiteSettings`.
   */
  notificationEmails: string[];
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
    name: { type: String, trim: true, maxlength: 120, default: "" },
    shortName: { type: String, trim: true, maxlength: 60, default: "" },
    title: { type: String, trim: true, maxlength: 200, default: "" },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    consortiumText: { type: String, trim: true, maxlength: 500, default: "" },
    consortiumHref: { type: String, trim: true, maxlength: 500, default: "" },
    projectLine: { type: String, trim: true, maxlength: 200, default: "" },
    fundingDisclaimer: { type: String, trim: true, maxlength: 2000, default: "" },
    notificationEmails: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const SiteSettings =
  mongoose.models.SiteSettings || mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
