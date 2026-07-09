import { connectMongoose } from "@/lib/db/mongoose";
import { type ISiteLink, SiteSettings } from "@/models/SiteSettings";
import type { SiteSettingsUpdateInput } from "./schemas";

const SETTINGS_KEY = "site";

export interface PublicSiteSettings {
  socialLinks: ISiteLink[];
  contactLinks: ISiteLink[];
}

function serializeLink(link: ISiteLink): ISiteLink {
  return { icon: link.icon, label: link.label, value: link.value, href: link.href };
}

/** Returns the singleton settings; empty lists before the first save. */
export async function getSiteSettings(): Promise<PublicSiteSettings> {
  await connectMongoose();
  const doc = await SiteSettings.findOne({ key: SETTINGS_KEY }).lean<{
    socialLinks: ISiteLink[];
    contactLinks: ISiteLink[];
  }>();
  return {
    socialLinks: (doc?.socialLinks ?? []).map(serializeLink),
    contactLinks: (doc?.contactLinks ?? []).map(serializeLink),
  };
}

export async function updateSiteSettings(
  input: SiteSettingsUpdateInput,
): Promise<PublicSiteSettings> {
  await connectMongoose();
  const doc = await SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { socialLinks: input.socialLinks, contactLinks: input.contactLinks } },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean<{ socialLinks: ISiteLink[]; contactLinks: ISiteLink[] }>();

  return {
    socialLinks: (doc?.socialLinks ?? []).map(serializeLink),
    contactLinks: (doc?.contactLinks ?? []).map(serializeLink),
  };
}
