import mongoose, { type Document, Schema } from "mongoose";

/**
 * A public link shown under a team member. `icon` holds a `react-icons/fa6`
 * export name (e.g. "FaOrcid") resolved at render time via
 * `lib/icons/registry`, mirroring `SiteSettings` links.
 */
export interface ITeamLink {
  icon: string;
  label: string;
  href: string;
}

export interface ITeamMember {
  image?: string;
  name: string;
  abstract?: string;
  links: ITeamLink[];
}

/**
 * One block of the public about page: a heading, a markdown body and an
 * optional side image. When the singleton has no sections yet, the page and
 * the admin editor fall back to `DEFAULT_ABOUT_SECTIONS` in
 * `lib/about/defaults`.
 */
export interface IAboutSection {
  title: string;
  body: string;
  image?: string;
  imageAlt?: string;
}

export interface IAboutSettings extends Document {
  key: "about";
  sections: IAboutSection[];
  team: ITeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamLinkSchema = new Schema<ITeamLink>(
  {
    icon: { type: String, required: true, trim: true, maxlength: 64 },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    href: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const AboutSectionSchema = new Schema<IAboutSection>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, maxlength: 20000 },
    image: { type: String, trim: true, maxlength: 500 },
    imageAlt: { type: String, trim: true, maxlength: 160 },
  },
  { _id: false },
);

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    image: { type: String, trim: true, maxlength: 500 },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    abstract: { type: String, trim: true, maxlength: 500 },
    links: { type: [TeamLinkSchema], default: [] },
  },
  { _id: false },
);

// Singleton document, addressed by the fixed `key`.
const AboutSettingsSchema = new Schema<IAboutSettings>(
  {
    key: { type: String, required: true, unique: true, default: "about" },
    sections: { type: [AboutSectionSchema], default: [] },
    team: { type: [TeamMemberSchema], default: [] },
  },
  { timestamps: true },
);

export const AboutSettings =
  mongoose.models.AboutSettings ||
  mongoose.model<IAboutSettings>("AboutSettings", AboutSettingsSchema);
