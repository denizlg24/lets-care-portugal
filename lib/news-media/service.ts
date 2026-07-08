import { connectMongoose } from "@/lib/db/mongoose";
import type {
  NewsItemCreateInput,
  NewsItemUpdateInput,
  NewsletterCreateInput,
  NewsletterUpdateInput,
  ProjectPhotoCreateInput,
  ProjectPhotoUpdateInput,
} from "@/lib/news-media/schemas";
import { deleteFileFromStorage } from "@/lib/storage/api";
import { type ILeanNewsItem, NewsItem } from "@/models/NewsItem";
import { type ILeanNewsletter, Newsletter } from "@/models/Newsletter";
import { type ILeanProjectPhoto, ProjectPhoto } from "@/models/ProjectPhoto";

function serialize<T extends { _id: unknown }>(doc: object): T {
  const value = doc as T;
  return { ...value, _id: String(value._id) };
}

interface ListOptions {
  onlyVisible?: boolean;
}

/**
 * Removes the backing file from storage without letting a storage failure
 * block the database delete — an orphaned file is preferable to a record that
 * cannot be removed.
 */
async function removeStorageFile(storageFileId: string): Promise<void> {
  try {
    await deleteFileFromStorage(storageFileId);
  } catch (error) {
    // Log so orphaned files can be audited, but never let a storage failure
    // block the surrounding database operation.
    console.error(`[news-media] failed to delete storage file ${storageFileId}`, error);
  }
}

/** Builds a Mongo update from a partial input, `$unset`-ing null-valued keys. */
function buildUpdate(input: Record<string, unknown>): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  const unset: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === null) unset[key] = 1;
    else if (value !== undefined) set[key] = value;
  }
  const update: Record<string, unknown> = { ...set };
  if (Object.keys(unset).length) update.$unset = unset;
  return update;
}

// --- Newsletters -----------------------------------------------------------

export async function listNewsletters({
  onlyVisible = false,
}: ListOptions = {}): Promise<ILeanNewsletter[]> {
  await connectMongoose();
  const docs = await Newsletter.find(onlyVisible ? { visible: true } : {})
    .sort({ publishedAt: -1 })
    .lean();
  return docs.map((doc) => serialize<ILeanNewsletter>(doc));
}

export async function createNewsletter(input: NewsletterCreateInput): Promise<ILeanNewsletter> {
  await connectMongoose();
  const doc = await Newsletter.create(input);
  return serialize<ILeanNewsletter>(doc.toObject());
}

export async function updateNewsletter(
  id: string,
  input: NewsletterUpdateInput,
): Promise<ILeanNewsletter | null> {
  await connectMongoose();
  // Only load the previous file id when the caller is replacing the file.
  const previous = input.storageFileId
    ? await Newsletter.findById(id).select("storageFileId").lean()
    : null;
  const doc = await Newsletter.findByIdAndUpdate(id, buildUpdate(input), {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!doc) return null;
  if (previous && previous.storageFileId !== doc.storageFileId) {
    await removeStorageFile(previous.storageFileId);
  }
  return serialize<ILeanNewsletter>(doc);
}

export async function deleteNewsletter(id: string): Promise<boolean> {
  await connectMongoose();
  const doc = await Newsletter.findByIdAndDelete(id).lean();
  if (!doc) return false;
  await removeStorageFile(doc.storageFileId);
  return true;
}

// --- Project photos --------------------------------------------------------

export async function listProjectPhotos({
  onlyVisible = false,
}: ListOptions = {}): Promise<ILeanProjectPhoto[]> {
  await connectMongoose();
  const docs = await ProjectPhoto.find(onlyVisible ? { visible: true } : {})
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => serialize<ILeanProjectPhoto>(doc));
}

export async function createProjectPhoto(
  input: ProjectPhotoCreateInput,
): Promise<ILeanProjectPhoto> {
  await connectMongoose();
  const doc = await ProjectPhoto.create(input);
  return serialize<ILeanProjectPhoto>(doc.toObject());
}

export async function updateProjectPhoto(
  id: string,
  input: ProjectPhotoUpdateInput,
): Promise<ILeanProjectPhoto | null> {
  await connectMongoose();
  const previous = input.storageFileId
    ? await ProjectPhoto.findById(id).select("storageFileId").lean()
    : null;
  const doc = await ProjectPhoto.findByIdAndUpdate(id, buildUpdate(input), {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!doc) return null;
  if (previous && previous.storageFileId !== doc.storageFileId) {
    await removeStorageFile(previous.storageFileId);
  }
  return serialize<ILeanProjectPhoto>(doc);
}

export async function deleteProjectPhoto(id: string): Promise<boolean> {
  await connectMongoose();
  const doc = await ProjectPhoto.findByIdAndDelete(id).lean();
  if (!doc) return false;
  await removeStorageFile(doc.storageFileId);
  return true;
}

// --- News ------------------------------------------------------------------

export async function listNewsItems({
  onlyVisible = false,
}: ListOptions = {}): Promise<ILeanNewsItem[]> {
  await connectMongoose();
  const docs = await NewsItem.find(onlyVisible ? { visible: true } : {})
    .sort({ date: -1 })
    .lean();
  return docs.map((doc) => serialize<ILeanNewsItem>(doc));
}

export async function createNewsItem(input: NewsItemCreateInput): Promise<ILeanNewsItem> {
  await connectMongoose();
  const doc = await NewsItem.create(input);
  return serialize<ILeanNewsItem>(doc.toObject());
}

export async function updateNewsItem(
  id: string,
  input: NewsItemUpdateInput,
): Promise<ILeanNewsItem | null> {
  await connectMongoose();
  const previous = input.storageFileId
    ? await NewsItem.findById(id).select("storageFileId").lean()
    : null;
  const doc = await NewsItem.findByIdAndUpdate(id, buildUpdate(input), {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!doc) return null;
  if (previous && previous.storageFileId !== doc.storageFileId) {
    await removeStorageFile(previous.storageFileId);
  }
  return serialize<ILeanNewsItem>(doc);
}

export async function deleteNewsItem(id: string): Promise<boolean> {
  await connectMongoose();
  const doc = await NewsItem.findByIdAndDelete(id).lean();
  if (!doc) return false;
  await removeStorageFile(doc.storageFileId);
  return true;
}
