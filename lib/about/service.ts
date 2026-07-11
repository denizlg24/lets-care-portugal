import { unstable_cache } from "next/cache";
import { DEFAULT_ABOUT_SECTIONS } from "@/lib/about/defaults";
import { connectMongoose } from "@/lib/db/mongoose";
import { AboutSettings, type IAboutSection, type ITeamMember } from "@/models/AboutSettings";
import type { AboutSettingsUpdateInput } from "./schemas";

const SETTINGS_KEY = "about";

/** Invalidated by `revalidateAboutPaths` whenever the admin saves. */
export const ABOUT_SETTINGS_CACHE_TAG = "about-settings";

export interface PublicAboutSettings {
  sections: IAboutSection[];
  team: ITeamMember[];
}

interface AboutSettingsLean {
  sections?: IAboutSection[];
  team?: ITeamMember[];
}

function serializeSection(section: IAboutSection): IAboutSection {
  return {
    title: section.title,
    body: section.body,
    image: section.image,
    imageAlt: section.imageAlt,
  };
}

function serializeMember(member: ITeamMember): ITeamMember {
  return {
    image: member.image,
    name: member.name,
    abstract: member.abstract,
    links: (member.links ?? []).map((link) => ({
      icon: link.icon,
      label: link.label,
      href: link.href,
    })),
  };
}

function serialize(doc: AboutSettingsLean | null): PublicAboutSettings {
  const stored = doc?.sections ?? [];
  return {
    // Documents saved before the sections refactor (or never saved) have no
    // sections — fall back to the bundled default content.
    sections:
      stored.length > 0
        ? stored.map(serializeSection)
        : DEFAULT_ABOUT_SECTIONS.map((s) => ({ ...s })),
    team: (doc?.team ?? []).map(serializeMember),
  };
}

/** Returns the singleton settings; default sections and empty team before the first save. */
export const getAboutSettings = unstable_cache(
  async (): Promise<PublicAboutSettings> => {
    await connectMongoose();
    const doc = await AboutSettings.findOne({ key: SETTINGS_KEY }).lean<AboutSettingsLean>();
    return serialize(doc);
  },
  [ABOUT_SETTINGS_CACHE_TAG],
  { tags: [ABOUT_SETTINGS_CACHE_TAG] },
);

export async function updateAboutSettings(
  input: AboutSettingsUpdateInput,
): Promise<PublicAboutSettings> {
  await connectMongoose();
  const doc = await AboutSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    {
      $set: { sections: input.sections, team: input.team },
      // Fields from before the sections refactor; drop them on first save.
      $unset: { mission: "", missionImages: "" },
    },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean<AboutSettingsLean>();

  return serialize(doc);
}
