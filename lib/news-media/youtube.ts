const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the 11-character video id from any of the usual YouTube URL shapes
 * (watch, youtu.be, shorts, embed, live) or from a bare id. Returns null when
 * no id can be found.
 */
export function extractYouTubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");
  let candidate: string | null = null;
  if (host === "youtu.be") {
    candidate = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments[0] === "watch") candidate = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(segments[0] ?? "")) {
      candidate = segments[1] ?? null;
    }
  }
  return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
}

export function youTubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

export function youTubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
}

export function youTubeThumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

/**
 * Fetches the video title via YouTube's keyless oEmbed endpoint. Returns null
 * on any failure (private/removed video, network error) so callers can fall
 * back to requiring a manual title.
 */
export async function fetchYouTubeTitle(youtubeId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(youTubeWatchUrl(youtubeId))}&format=json`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: unknown };
    return typeof data.title === "string" && data.title.trim() ? data.title.trim() : null;
  } catch {
    return null;
  }
}
