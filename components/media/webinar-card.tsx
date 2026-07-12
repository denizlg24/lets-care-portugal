import { Play } from "lucide-react";
import Image from "next/image";
import { formatMediaDateShort } from "@/lib/news-media/format";
import { youTubeThumbnailUrl, youTubeWatchUrl } from "@/lib/news-media/youtube";
import type { ILeanWebinar } from "@/models/Webinar";

interface WebinarCardProps {
  webinar: ILeanWebinar;
}

/**
 * A webinar entry on the public media pages. The whole card links out to the
 * recording on YouTube.
 */
export function WebinarCard({ webinar }: WebinarCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <a
        href={youTubeWatchUrl(webinar.youtubeId)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full flex-col"
      >
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
          <Image
            src={youTubeThumbnailUrl(webinar.youtubeId)}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
              <Play className="ml-0.5 size-5 fill-current" aria-hidden />
            </span>
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <time
            dateTime={new Date(webinar.publishedAt).toISOString()}
            className="text-xs font-medium text-muted-foreground"
          >
            {formatMediaDateShort(webinar.publishedAt)}
          </time>
          <h3 className="mt-2 text-balance font-heading text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {webinar.title}
          </h3>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-secondary">
            Ver no YouTube
            <Play className="size-3.5" aria-hidden />
          </span>
        </div>
      </a>
    </article>
  );
}
