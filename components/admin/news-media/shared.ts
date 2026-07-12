import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";

export interface NewsletterItem {
  id: string;
  title: string;
  publishedAt: string;
  fileUrl: string;
  storageFileId: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  thumbnailStorageFileId: string | null;
  visible: boolean;
}

export interface PhotoItem {
  id: string;
  imageUrl: string;
  storageFileId: string;
  subtitle: string;
  takenAt: string | null;
  visible: boolean;
}

export interface NewsItem {
  id: string;
  imageUrl: string;
  storageFileId: string;
  title: string;
  description: string;
  date: string;
  externalUrl: string;
  visible: boolean;
}

export interface WebinarItem {
  id: string;
  youtubeId: string;
  title: string;
  publishedAt: string;
  visible: boolean;
}

// The API returns lean documents keyed by `_id` with dates serialized as ISO
// strings. These normalizers map that raw shape to the client item shape
// (`id`, non-null strings) so freshly created/updated rows match what the
// server page produced — without this, `id` is undefined, which breaks list
// keys, the visibility toggle, and deletes.

// Dates are ISO strings over the wire (client fetches) but `Date` when the
// server page passes lean documents straight in, so the normalizers accept both.
export interface RawNewsletter {
  _id: string;
  title: string;
  publishedAt: string | Date;
  fileUrl: string;
  storageFileId: string;
  fileSize?: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
  visible: boolean;
}

export interface RawPhoto {
  _id: string;
  imageUrl: string;
  storageFileId: string;
  subtitle?: string;
  takenAt?: string | Date | null;
  visible: boolean;
}

export interface RawNews {
  _id: string;
  imageUrl: string;
  storageFileId: string;
  title: string;
  description: string;
  date: string | Date;
  externalUrl: string;
  visible: boolean;
}

export interface RawWebinar {
  _id: string;
  youtubeId: string;
  title: string;
  publishedAt: string | Date;
  visible: boolean;
}

export function normalizeWebinar(raw: RawWebinar): WebinarItem {
  return {
    id: raw._id,
    youtubeId: raw.youtubeId,
    title: raw.title,
    publishedAt: new Date(raw.publishedAt).toISOString(),
    visible: raw.visible,
  };
}

export function normalizeNewsletter(raw: RawNewsletter): NewsletterItem {
  return {
    id: raw._id,
    title: raw.title,
    publishedAt: new Date(raw.publishedAt).toISOString(),
    fileUrl: raw.fileUrl,
    storageFileId: raw.storageFileId,
    fileSize: raw.fileSize ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? null,
    thumbnailStorageFileId: raw.thumbnailStorageFileId ?? null,
    visible: raw.visible,
  };
}

export function normalizePhoto(raw: RawPhoto): PhotoItem {
  return {
    id: raw._id,
    imageUrl: raw.imageUrl,
    storageFileId: raw.storageFileId,
    subtitle: raw.subtitle ?? "",
    takenAt: raw.takenAt ? new Date(raw.takenAt).toISOString() : null,
    visible: raw.visible,
  };
}

export function normalizeNews(raw: RawNews): NewsItem {
  return {
    id: raw._id,
    imageUrl: raw.imageUrl,
    storageFileId: raw.storageFileId,
    title: raw.title,
    description: raw.description,
    date: new Date(raw.date).toISOString(),
    externalUrl: raw.externalUrl,
    visible: raw.visible,
  };
}

/**
 * Uploads an image or PDF and returns its public URL + storage id. PDFs also
 * get a first-page thumbnail rendered server-side (absent when it fails).
 */
export async function uploadNewsMediaFile(file: File): Promise<{
  url: string;
  storageFileId: string;
  size: number;
  thumbnailUrl?: string;
  thumbnailStorageFileId?: string;
}> {
  const body = new FormData();
  body.append("file", file);
  // Uploads can be up to 10 MB, so allow well beyond the default 15s timeout.
  const response = await fetchWithTimeout(
    "/api/admin/news-media/upload",
    { method: "POST", body },
    60_000,
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Não foi possível carregar o ficheiro.");
  }
  return response.json();
}

const DATE_FORMAT = new Intl.DateTimeFormat("pt-PT", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Formats an ISO string as a pt-PT short date. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** ISO datetime → `yyyy-mm-dd` for a native date input. */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

/** `yyyy-mm-dd` from a date input → ISO datetime (midnight UTC), or null. */
export function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export { formatFileSize } from "@/lib/news-media/format";
