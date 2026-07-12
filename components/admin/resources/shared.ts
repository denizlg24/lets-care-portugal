import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import type { ResourceType } from "@/lib/resources/constants";

export interface ResourceItem {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  authors: string;
  publishedAt: string;
  fileUrl: string | null;
  storageFileId: string | null;
  fileSize: number | null;
  thumbnailUrl: string | null;
  thumbnailStorageFileId: string | null;
  externalUrl: string | null;
  visible: boolean;
}

// Dates are ISO strings over the wire (client fetches) but `Date` when the
// server page passes lean documents straight in, so the normalizer accepts both.
export interface RawResource {
  _id: string;
  type: ResourceType;
  title: string;
  description?: string;
  authors?: string;
  publishedAt: string | Date;
  fileUrl?: string;
  storageFileId?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
  externalUrl?: string;
  visible: boolean;
}

export function normalizeResource(raw: RawResource): ResourceItem {
  return {
    id: raw._id,
    type: raw.type,
    title: raw.title,
    description: raw.description ?? "",
    authors: raw.authors ?? "",
    publishedAt: new Date(raw.publishedAt).toISOString(),
    fileUrl: raw.fileUrl ?? null,
    storageFileId: raw.storageFileId ?? null,
    fileSize: raw.fileSize ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? null,
    thumbnailStorageFileId: raw.thumbnailStorageFileId ?? null,
    externalUrl: raw.externalUrl ?? null,
    visible: raw.visible,
  };
}

/**
 * Uploads a PDF or standalone HTML file and returns its public URL + storage
 * id. PDFs also get a first-page thumbnail rendered server-side (absent when
 * it fails).
 */
export async function uploadResourceFile(file: File): Promise<{
  url: string;
  storageFileId: string;
  size: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
}> {
  const body = new FormData();
  body.append("file", file);
  // Uploads can be large, so allow well beyond the default 15s timeout.
  const response = await fetchWithTimeout(
    "/api/admin/resources/upload",
    { method: "POST", body },
    60_000,
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Não foi possível carregar o ficheiro.");
  }
  return response.json();
}
