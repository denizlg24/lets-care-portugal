import { connectMongoose } from "@/lib/db/mongoose";
import { type ISiteLink, SiteSettings } from "@/models/SiteSettings";
import { DEFAULT_SITE_CONFIG } from "./defaults";
import type {
  NotificationEmailsUpdateInput,
  SiteConfigUpdateInput,
  SiteSettingsUpdateInput,
} from "./schemas";

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
 * Effective site identity + footer config, read at page generation time by
 * the root layout metadata and the footer (all public pages are ISR, so this
 * only hits the DB when a page is (re)generated). Falls back to
 * `DEFAULT_SITE_CONFIG` until the admin saves the first version (detected by
 * an empty `name`).
 */
export async function getSiteConfig(): Promise<PublicSiteConfig> {
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
}

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

/**
 * Server-only: the internal addresses notified when a new contact ticket
 * arrives. Deliberately not part of `PublicSiteSettings` so these never reach
 * the client.
 */
export async function getNotificationEmails(): Promise<string[]> {
  await connectMongoose();
  const doc = await SiteSettings.findOne({ key: SETTINGS_KEY }, { notificationEmails: 1 }).lean<{
    notificationEmails?: string[];
  }>();
  return doc?.notificationEmails ?? [];
}

export async function updateNotificationEmails(
  input: NotificationEmailsUpdateInput,
): Promise<string[]> {
  await connectMongoose();
  const doc = await SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: { notificationEmails: input.notificationEmails } },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean<{ notificationEmails?: string[] }>();
  return doc?.notificationEmails ?? [];
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
