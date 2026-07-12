import { Download, ExternalLink, FileText } from "lucide-react";
import Image from "next/image";
import { formatFileSize, formatMediaDateShort } from "@/lib/news-media/format";
import type { ILeanResource } from "@/models/Resource";

interface ResourceCardProps {
  resource: ILeanResource;
}

/**
 * A document resource (report, paper, policy brief) shown as a horizontal
 * card: PDF cover on the left, metadata and actions on the right. Papers
 * without an uploaded file link out to the publisher instead.
 */
export function ResourceCard({ resource }: ResourceCardProps) {
  const size = formatFileSize(resource.fileSize);

  return (
    <article className="flex gap-5 rounded-xl border border-border bg-card p-5">
      <div className="hidden w-20 shrink-0 sm:block md:w-24">
        <div className="relative aspect-[210/297] overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
          {resource.thumbnailUrl ? (
            <Image
              src={resource.thumbnailUrl}
              alt=""
              fill
              sizes="96px"
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <FileText className="size-7 text-muted-foreground/50" aria-hidden />
            </div>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="text-xs font-medium text-muted-foreground">
          <time dateTime={new Date(resource.publishedAt).toISOString()}>
            {formatMediaDateShort(resource.publishedAt)}
          </time>
          {resource.authors ? ` · ${resource.authors}` : ""}
        </p>
        <h3 className="mt-1.5 text-balance font-heading text-lg font-bold leading-snug text-foreground">
          {resource.title}
        </h3>
        {resource.description ? (
          <p className="mt-2 line-clamp-3 text-pretty text-sm text-muted-foreground">
            {resource.description}
          </p>
        ) : null}
        <p className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-4 text-sm font-medium">
          {resource.fileUrl ? (
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-secondary transition-colors hover:text-primary"
            >
              <Download className="size-4" aria-hidden />
              Descarregar PDF
              {size ? <span className="font-normal text-muted-foreground">({size})</span> : null}
            </a>
          ) : null}
          {resource.externalUrl ? (
            <a
              href={resource.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-secondary transition-colors hover:text-primary"
            >
              <ExternalLink className="size-4" aria-hidden />
              Ver publicação
            </a>
          ) : null}
        </p>
      </div>
    </article>
  );
}
