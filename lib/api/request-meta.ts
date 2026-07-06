/**
 * Request metadata extracted from proxy/CDN headers. Geo fields come from
 * Vercel's `x-vercel-ip-*` headers and are absent in local development.
 *
 * The raw IP is exposed for rate limiting only — persist geo fields for
 * analytics, not the IP itself.
 */
export interface RequestMeta {
  ip: string;
  country?: string;
  region?: string;
  city?: string;
  userAgent?: string;
  referer?: string;
}

function decodeHeader(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Best-effort client IP for rate limiting. Falls back to "unknown". */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function getRequestMeta(request: Request): RequestMeta {
  return {
    ip: getClientIp(request),
    country: decodeHeader(request.headers.get("x-vercel-ip-country")),
    region: decodeHeader(request.headers.get("x-vercel-ip-country-region")),
    city: decodeHeader(request.headers.get("x-vercel-ip-city")),
    userAgent: request.headers.get("user-agent") ?? undefined,
    referer: request.headers.get("referer") ?? undefined,
  };
}
