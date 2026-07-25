import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  type HeadObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

/**
 * Client for the S3-compatible object storage exposed by denizlg24.com at
 * `/v2` (path-style, SigV4 on every request — there is no anonymous read).
 * Objects are therefore never linked directly: `publicUrl` points at the
 * `/api/files/[...key]` proxy in this app, which streams them back.
 *
 *   S3_ENDPOINT           base URL of the S3 API, e.g. https://host/v2
 *   S3_REGION             signing region (default: eu-west-1)
 *   S3_BUCKET             bucket holding every object
 *   S3_ACCESS_KEY_ID      SigV4 credential
 *   S3_SECRET_ACCESS_KEY  SigV4 credential
 *   S3_IMAGE_PREFIX       key prefix for images (default: images)
 *   S3_FILE_PREFIX        key prefix for other files (default: files)
 *   S3_SPREADSHEET_PREFIX key prefix for spreadsheets (default: spreadsheets)
 */

const DEFAULT_REGION = "eu-west-1";
const DEFAULT_MIME_TYPE = "application/octet-stream";

export type StorageBucket = "image" | "file" | "spreadsheet";

export interface StoredFile {
  /** The S3 object key. Persisted as `storageFileId` so the file can be deleted later. */
  id: string;
  filename: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
}

export interface StorageObject {
  body: ReadableStream<Uint8Array> | null;
  filename: string;
  mimeType: string;
  sizeBytes?: number;
  etag?: string;
  lastModified?: Date;
  contentRange?: string;
  status: 200 | 206;
}

interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

let cachedClient: { client: S3Client; config: S3Config } | undefined;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getS3Config(): S3Config {
  return {
    endpoint: requireEnv("S3_ENDPOINT").replace(/\/+$/, ""),
    region: process.env.S3_REGION?.trim() || DEFAULT_REGION,
    bucket: requireEnv("S3_BUCKET"),
    accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY"),
  };
}

function getClient(): { client: S3Client; bucket: string } {
  const config = getS3Config();

  if (
    !cachedClient ||
    cachedClient.config.endpoint !== config.endpoint ||
    cachedClient.config.region !== config.region ||
    cachedClient.config.accessKeyId !== config.accessKeyId ||
    cachedClient.config.secretAccessKey !== config.secretAccessKey
  ) {
    cachedClient?.client.destroy();
    cachedClient = {
      config,
      client: new S3Client({
        endpoint: config.endpoint,
        region: config.region,
        forcePathStyle: true,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
    };
  }

  return { client: cachedClient.client, bucket: config.bucket };
}

function trimSlashes(value: string): string {
  return value.replace(/^\/+|\/+$/g, "");
}

/** The key prefixes this app is allowed to read and write. */
export function getBucketPrefixes(): Record<StorageBucket, string> {
  return {
    image: trimSlashes(process.env.S3_IMAGE_PREFIX ?? "images"),
    file: trimSlashes(process.env.S3_FILE_PREFIX ?? "files"),
    spreadsheet: trimSlashes(process.env.S3_SPREADSHEET_PREFIX ?? "spreadsheets"),
  };
}

function splitFilename(name: string): { base: string; extension: string } {
  const trimmed = name.trim() || "upload";
  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex <= 0) {
    return { base: trimmed, extension: "" };
  }
  return {
    base: trimmed.slice(0, dotIndex),
    extension: trimmed.slice(dotIndex).toLowerCase(),
  };
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "ficheiro"
  );
}

/**
 * Every upload gets a UUID-suffixed key, so writes never collide and no
 * existence check is needed before a PUT.
 */
function buildObjectKey(bucket: StorageBucket, filename: string): string {
  const { base, extension } = splitFilename(filename);
  const safeExtension = /^\.[a-z0-9]{1,12}$/.test(extension) ? extension : "";
  return `${getBucketPrefixes()[bucket]}/${slugify(base)}-${crypto.randomUUID()}${safeExtension}`;
}

/** The public, permanent URL for a key — served by `app/api/files/[...key]`. */
export function getPublicUrl(key: string): string {
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Rejects keys that could escape the app's own prefixes, so the download
 * proxy can never be pointed at unrelated objects in the bucket.
 */
export function isServableKey(key: string): boolean {
  if (!key || key.length > 1024 || key.includes("\\") || /\p{Cc}/u.test(key)) {
    return false;
  }
  const segments = key.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return false;
  }
  return Object.values(getBucketPrefixes()).includes(segments[0]);
}

function isNotFound(error: unknown): boolean {
  const status = (error as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
  const name = (error as { name?: string })?.name;
  return status === 404 || name === "NoSuchKey" || name === "NotFound";
}

function filenameFromKey(key: string): string {
  return key.slice(key.lastIndexOf("/") + 1) || "ficheiro";
}

export async function uploadFileToStorage(file: File, bucket: StorageBucket): Promise<StoredFile> {
  const { client, bucket: s3Bucket } = getClient();
  const filename = file.name || "upload";
  const key = buildObjectKey(bucket, filename);
  const mimeType = file.type || DEFAULT_MIME_TYPE;
  const body = new Uint8Array(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
      ContentLength: body.byteLength,
    }),
  );

  return {
    id: key,
    filename,
    path: key,
    mimeType,
    sizeBytes: body.byteLength,
    publicUrl: getPublicUrl(key),
  };
}

export async function deleteFileFromStorage(key: string): Promise<void> {
  const { client, bucket } = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function toStorageObject(
  key: string,
  output: HeadObjectCommandOutput & { ContentRange?: string },
  body: ReadableStream<Uint8Array> | null,
): StorageObject {
  return {
    body,
    filename: filenameFromKey(key),
    mimeType: output.ContentType || DEFAULT_MIME_TYPE,
    sizeBytes: output.ContentLength,
    etag: output.ETag,
    lastModified: output.LastModified,
    contentRange: output.ContentRange,
    status: output.ContentRange ? 206 : 200,
  };
}

/** Returns `null` when the object does not exist. */
export async function getStorageObject(
  key: string,
  options: { range?: string | null } = {},
): Promise<StorageObject | null> {
  const { client, bucket } = getClient();

  try {
    const output = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ...(options.range ? { Range: options.range } : {}),
      }),
    );
    return toStorageObject(key, output, output.Body?.transformToWebStream() ?? null);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

/** Returns `null` when the object does not exist. */
export async function headStorageObject(key: string): Promise<StorageObject | null> {
  const { client, bucket } = getClient();

  try {
    const output = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return toStorageObject(key, output, null);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
