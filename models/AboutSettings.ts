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
 * One slot of the 2×2 collage next to the mission text. An empty `image`
 * means the slot falls back to the bundled default in `lib/about/defaults`.
 */
export interface IMissionImage {
  image: string;
  alt?: string;
}

export interface IAboutSettings extends Document {
  key: "about";
  mission: string;
  missionImages: IMissionImage[];
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

const MissionImageSchema = new Schema<IMissionImage>(
  {
    image: { type: String, trim: true, maxlength: 500, default: "" },
    alt: { type: String, trim: true, maxlength: 160 },
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
    mission: { type: String, default: "", maxlength: 5000 },
    missionImages: { type: [MissionImageSchema], default: [] },
    team: { type: [TeamMemberSchema], default: [] },
  },
  { timestamps: true },
);

export const AboutSettings =
  mongoose.models.AboutSettings ||
  mongoose.model<IAboutSettings>("AboutSettings", AboutSettingsSchema);
