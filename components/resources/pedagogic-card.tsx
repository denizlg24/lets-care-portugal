import { ArrowUpRight, Puzzle } from "lucide-react";
import Image from "next/image";
import { formatMediaDateShort } from "@/lib/news-media/format";
import type { ILeanResource } from "@/models/Resource";

interface PedagogicCardProps {
  resource: ILeanResource;
}

/**
 * An interactive pedagogic material (e.g. an HTML game). The whole card opens
 * the material in a new tab — it is served from the storage service's origin,
 * so its scripts never run on this site's domain.
 */
export function PedagogicCard({ resource }: PedagogicCardProps) {
  const href = resource.fileUrl ?? resource.externalUrl;
  if (!href) return null;

  return (
    <article className="group h-full">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg"
      >
        {resource.thumbnailUrl ? (
          <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted">
            <Image
              src={resource.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <span className="mx-6 mt-6 flex size-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <Puzzle className="size-5" aria-hidden />
          </span>
        )}
        <div className="flex flex-1 flex-col p-6 pt-4">
          <h3 className="text-balance font-heading text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
            {resource.title}
          </h3>
          {resource.description ? (
            <p className="mt-2 line-clamp-3 text-pretty text-sm text-muted-foreground">
              {resource.description}
            </p>
          ) : null}
          <span className="mt-auto flex items-center justify-between pt-5">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
              Abrir material
              <ArrowUpRight
                className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </span>
            <time
              dateTime={new Date(resource.publishedAt).toISOString()}
              className="text-xs font-medium text-muted-foreground"
            >
              {formatMediaDateShort(resource.publishedAt)}
            </time>
          </span>
        </div>
      </a>
    </article>
  );
}
