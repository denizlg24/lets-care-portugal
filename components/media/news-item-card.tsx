import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { formatMediaDateShort } from "@/lib/news-media/format";
import type { ILeanNewsItem } from "@/models/NewsItem";

interface NewsItemCardProps {
  item: ILeanNewsItem;
}

/**
 * A news entry on the public media pages. The whole card links out to the
 * original story on the external outlet.
 */
export function NewsItemCard({ item }: NewsItemCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <a
        href={item.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full flex-col"
      >
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <time
            dateTime={new Date(item.date).toISOString()}
            className="text-xs font-medium text-muted-foreground"
          >
            {formatMediaDateShort(item.date)}
          </time>
          <h3 className="mt-2 text-balance font-heading text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-3 text-pretty text-sm text-muted-foreground">
            {item.description}
          </p>
          <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-secondary">
            Ler notícia completa
            <ExternalLink className="size-3.5" aria-hidden />
          </span>
        </div>
      </a>
    </article>
  );
}
