import type { NextRequest } from "next/server";

import { handleRouteError } from "@/lib/api/responses";
import {
  getStorageObject,
  headStorageObject,
  isServableKey,
  type StorageObject,
} from "@/lib/storage/api";

export const runtime = "nodejs";

/**
 * Public download proxy for the S3 bucket. The storage API requires a SigV4
 * signature on every request and serves nothing anonymously, so objects are
 * fetched here with the server-side credentials and streamed back. Keys are
 * UUID-suffixed and never reused, hence the immutable caching.
 */
const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

// Admin-uploaded HTML (interactive pedagogic materials) is served from this
// app's own origin now that it is proxied. A sandbox CSP puts it in an opaque
// origin so its scripts still run but cannot reach our cookies or storage.
const SANDBOXABLE_TYPES =
  /^(text\/html|application\/xhtml\+xml|image\/svg\+xml|text\/xml|application\/xml)\b/i;
const SANDBOX_POLICY = "sandbox allow-scripts allow-forms allow-modals allow-popups";

function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function buildHeaders(object: StorageObject): Headers {
  const headers = new Headers({
    "Content-Type": object.mimeType,
    "Content-Disposition": contentDisposition(object.filename),
    "Cache-Control": IMMUTABLE_CACHE,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
  });

  if (object.sizeBytes !== undefined) headers.set("Content-Length", String(object.sizeBytes));
  if (object.contentRange) headers.set("Content-Range", object.contentRange);
  if (object.etag) headers.set("ETag", object.etag);
  if (object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());
  if (SANDBOXABLE_TYPES.test(object.mimeType)) {
    headers.set("Content-Security-Policy", SANDBOX_POLICY);
  }

  return headers;
}

async function resolveKey(params: Promise<{ key: string[] }>): Promise<string | null> {
  const { key } = await params;
  const decoded = key.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
  const joined = decoded.join("/");
  return isServableKey(joined) ? joined : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const key = await resolveKey(params);
    if (!key) return new Response("Not found", { status: 404 });

    const object = await getStorageObject(key, { range: request.headers.get("range") });
    if (!object) return new Response("Not found", { status: 404 });

    return new Response(object.body, { status: object.status, headers: buildHeaders(object) });
  } catch (error) {
    return handleRouteError("files/[...key]:GET", error);
  }
}

export async function HEAD(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
) {
  try {
    const key = await resolveKey(params);
    if (!key) return new Response(null, { status: 404 });

    const object = await headStorageObject(key);
    if (!object) return new Response(null, { status: 404 });

    return new Response(null, { status: 200, headers: buildHeaders(object) });
  } catch (error) {
    return handleRouteError("files/[...key]:HEAD", error);
  }
}
