import { connectMongoose } from "@/lib/db/mongoose";
import type { ResourceCreateInput, ResourceUpdateInput } from "@/lib/resources/schemas";
import { deleteFileFromStorage } from "@/lib/storage/api";
import { type ILeanResource, Resource } from "@/models/Resource";

function serialize(doc: object): ILeanResource {
  const value = doc as ILeanResource;
  return { ...value, _id: String(value._id) };
}

/**
 * Removes the backing file from storage without letting a storage failure
 * block the database operation — an orphaned file is preferable to a record
 * that cannot be removed.
 */
async function removeStorageFile(storageFileId: string): Promise<void> {
  try {
    await deleteFileFromStorage(storageFileId);
  } catch (error) {
    console.error(`[resources] failed to delete storage file ${storageFileId}`, error);
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

interface ListOptions {
  onlyVisible?: boolean;
}

/** All resources, newest first — the public page groups them by type. */
export async function listResources({
  onlyVisible = false,
}: ListOptions = {}): Promise<ILeanResource[]> {
  await connectMongoose();
  const docs = await Resource.find(onlyVisible ? { visible: true } : {})
    .sort({ publishedAt: -1 })
    .lean();
  return docs.map(serialize);
}

export async function createResource(input: ResourceCreateInput): Promise<ILeanResource> {
  await connectMongoose();
  const doc = await Resource.create(input);
  return serialize(doc.toObject());
}

export async function updateResource(
  id: string,
  input: ResourceUpdateInput,
): Promise<ILeanResource | null> {
  await connectMongoose();
  // Only load the previous file ids when the caller is replacing or clearing them.
  const previous =
    input.storageFileId !== undefined || input.thumbnailStorageFileId !== undefined
      ? await Resource.findById(id).select("storageFileId thumbnailStorageFileId").lean()
      : null;
  const doc = await Resource.findByIdAndUpdate(id, buildUpdate(input), {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!doc) return null;
  if (previous?.storageFileId && previous.storageFileId !== doc.storageFileId) {
    await removeStorageFile(previous.storageFileId);
  }
  if (
    previous?.thumbnailStorageFileId &&
    previous.thumbnailStorageFileId !== doc.thumbnailStorageFileId
  ) {
    await removeStorageFile(previous.thumbnailStorageFileId);
  }
  return serialize(doc);
}

export async function deleteResource(id: string): Promise<boolean> {
  await connectMongoose();
  const doc = await Resource.findByIdAndDelete(id).lean();
  if (!doc) return false;
  if (doc.storageFileId) await removeStorageFile(doc.storageFileId);
  if (doc.thumbnailStorageFileId) await removeStorageFile(doc.thumbnailStorageFileId);
  return true;
}
