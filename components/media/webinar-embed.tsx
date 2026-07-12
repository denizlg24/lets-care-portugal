import { formatMediaDate } from "@/lib/news-media/format";
import { youTubeEmbedUrl } from "@/lib/news-media/youtube";
import type { ILeanWebinar } from "@/models/Webinar";

interface WebinarEmbedProps {
  webinar: ILeanWebinar;
}

/** The featured (most recent) webinar, embedded as a privacy-enhanced player. */
export function WebinarEmbed({ webinar }: WebinarEmbedProps) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-video w-full bg-muted">
        <iframe
          src={youTubeEmbedUrl(webinar.youtubeId)}
          title={webinar.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full"
        />
      </div>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-5">
        <span className="font-heading text-lg font-bold text-foreground">{webinar.title}</span>
        <time
          dateTime={new Date(webinar.publishedAt).toISOString()}
          className="text-xs font-medium text-muted-foreground"
        >
          {formatMediaDate(webinar.publishedAt)}
        </time>
      </figcaption>
    </figure>
  );
}
