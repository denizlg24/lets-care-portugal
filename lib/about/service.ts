import { connectMongoose } from "@/lib/db/mongoose";
import { AboutSettings, type IMissionImage, type ITeamMember } from "@/models/AboutSettings";
import type { AboutSettingsUpdateInput } from "./schemas";

const SETTINGS_KEY = "about";

export interface PublicAboutSettings {
  mission: string;
  missionImages: IMissionImage[];
  team: ITeamMember[];
}

interface AboutSettingsLean {
  mission: string;
  missionImages: IMissionImage[];
  team: ITeamMember[];
}

function serializeMissionImage(image: IMissionImage): IMissionImage {
  return { image: image.image, alt: image.alt };
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
  return {
    mission: doc?.mission ?? "",
    missionImages: (doc?.missionImages ?? []).map(serializeMissionImage),
    team: (doc?.team ?? []).map(serializeMember),
  };
}

/** Returns the singleton settings; empty mission, images and team before the first save. */
export async function getAboutSettings(): Promise<PublicAboutSettings> {
  await connectMongoose();
  const doc = await AboutSettings.findOne({ key: SETTINGS_KEY }).lean<AboutSettingsLean>();
  return serialize(doc);
}

export async function updateAboutSettings(
  input: AboutSettingsUpdateInput,
): Promise<PublicAboutSettings> {
  await connectMongoose();
  const doc = await AboutSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { mission: input.mission, missionImages: input.missionImages, team: input.team } },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean<AboutSettingsLean>();

  return serialize(doc);
}
