import { unstable_cache } from "next/cache";
import { connectMongoose } from "@/lib/db/mongoose";
import { type ISiteLink, SiteSettings } from "@/models/SiteSettings";
import { DEFAULT_SITE_CONFIG } from "./defaults";
import type { SiteConfigUpdateInput, SiteSettingsUpdateInput } from "./schemas";

const SETTINGS_KEY = "site";

/** Invalidated by `revalidateSiteConfig` whenever the admin saves the site config. */
export const SITE_CONFIG_CACHE_TAG = "site-config";

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

export interface PublicSiteConfig {
  name: string;
  shortName: string;
  title: string;
  description: string;
  consortiumText: string;
  consortiumHref: string;
  projectLine: string;
  fundingDisclaimer: string;
}

type SiteConfigLean = Partial<PublicSiteConfig>;

const SITE_CONFIG_FIELDS = {
  name: 1,
  shortName: 1,
  title: 1,
  description: 1,
  consortiumText: 1,
  consortiumHref: 1,
  projectLine: 1,
  fundingDisclaimer: 1,
} as const;

/**
 * Effective site identity + footer config, read on every page via the root
 * layout metadata and the footer, so the DB hit is cached under
 * `SITE_CONFIG_CACHE_TAG`. Falls back to `DEFAULT_SITE_CONFIG` until the
 * admin saves the first version (detected by an empty `name`).
 */
export const getSiteConfig = unstable_cache(
  async (): Promise<PublicSiteConfig> => {
    await connectMongoose();
    const doc = await SiteSettings.findOne(
      { key: SETTINGS_KEY },
      SITE_CONFIG_FIELDS,
    ).lean<SiteConfigLean>();

    if (!doc?.name) return { ...DEFAULT_SITE_CONFIG };

    return {
      name: doc.name,
      shortName: doc.shortName ?? "",
      title: doc.title ?? "",
      description: doc.description ?? "",
      consortiumText: doc.consortiumText ?? "",
      consortiumHref: doc.consortiumHref ?? "",
      projectLine: doc.projectLine ?? "",
      fundingDisclaimer: doc.fundingDisclaimer ?? "",
    };
  },
  [SITE_CONFIG_CACHE_TAG],
  { tags: [SITE_CONFIG_CACHE_TAG] },
);

export async function updateSiteConfig(input: SiteConfigUpdateInput): Promise<PublicSiteConfig> {
  await connectMongoose();
  const doc = await SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { ...input } },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean<SiteConfigLean>();

  return {
    name: doc?.name ?? "",
    shortName: doc?.shortName ?? "",
    title: doc?.title ?? "",
    description: doc?.description ?? "",
    consortiumText: doc?.consortiumText ?? "",
    consortiumHref: doc?.consortiumHref ?? "",
    projectLine: doc?.projectLine ?? "",
    fundingDisclaimer: doc?.fundingDisclaimer ?? "",
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
