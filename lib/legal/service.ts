import { connectMongoose } from "@/lib/db/mongoose";
import type { LegalSlug } from "@/lib/legal/constants";
import { LEGAL_SLUGS } from "@/lib/legal/constants";
import { DEFAULT_LEGAL_PAGES } from "@/lib/legal/defaults";
import type { LegalPageUpdateInput } from "@/lib/legal/schemas";
import { LegalPage } from "@/models/LegalPage";

export interface PublicLegalPage {
  slug: LegalSlug;
  title: string;
  content: string;
  /** ISO date of the last admin save; null while the bundled default is shown. */
  updatedAt: string | null;
}

interface LegalPageLean {
  slug: LegalSlug;
  title: string;
  content: string;
  updatedAt: Date;
}

function fromDocument(slug: LegalSlug, doc: LegalPageLean | null): PublicLegalPage {
  if (!doc) {
    const fallback = DEFAULT_LEGAL_PAGES[slug];
    return { slug, title: fallback.title, content: fallback.content, updatedAt: null };
  }
  return {
    slug,
    title: doc.title,
    content: doc.content,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/** Returns the saved page, or the bundled default before the first save. */
export async function getLegalPage(slug: LegalSlug): Promise<PublicLegalPage> {
  await connectMongoose();
  const doc = await LegalPage.findOne({ slug }).lean<LegalPageLean>();
  return fromDocument(slug, doc);
}

/** All four legal pages in declaration order, defaults filling the gaps. */
export async function listLegalPages(): Promise<PublicLegalPage[]> {
  await connectMongoose();
  const docs = await LegalPage.find({}).lean<LegalPageLean[]>();
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc]));
  return LEGAL_SLUGS.map((slug) => fromDocument(slug, bySlug.get(slug) ?? null));
}

export async function updateLegalPage(
  slug: LegalSlug,
  input: LegalPageUpdateInput,
): Promise<PublicLegalPage> {
  await connectMongoose();
  const doc = await LegalPage.findOneAndUpdate(
    { slug },
    { $set: { title: input.title, content: input.content } },
    { returnDocument: "after", upsert: true, runValidators: true },
  ).lean<LegalPageLean>();
  return fromDocument(slug, doc);
}
