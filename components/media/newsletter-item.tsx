import Image from "next/image";
import { formatFileSize, formatMediaDateShort } from "@/lib/news-media/format";
import type { ILeanNewsletter } from "@/models/Newsletter";

interface NewsletterItemProps {
  newsletter: ILeanNewsletter;
}

/**
 * A newsletter shown as a plain cover: the first-page thumbnail with title and
 * date underneath, no card chrome. Newsletters uploaded before thumbnails
 * existed get a typographic cover instead. The whole block opens the PDF.
 */
export function NewsletterItem({ newsletter }: NewsletterItemProps) {
  const size = formatFileSize(newsletter.fileSize);

  return (
    <li>
      <a
        href={newsletter.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        <div className="relative aspect-[210/297] overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10 transition group-hover:shadow-lg group-hover:ring-foreground/20">
          {newsletter.thumbnailUrl ? (
            <Image
              src={newsletter.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover object-top"
            />
          ) : (
            <div className="flex h-full flex-col justify-between p-5">
              <p className="line-clamp-5 font-heading text-lg font-bold leading-snug text-muted-foreground">
                {newsletter.title}
              </p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                LeTs-Care Portugal
              </p>
            </div>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 font-heading font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {newsletter.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          <time dateTime={new Date(newsletter.publishedAt).toISOString()}>
            {formatMediaDateShort(newsletter.publishedAt)}
          </time>
          {" · PDF"}
          {size ? ` · ${size}` : ""}
        </p>
      </a>
    </li>
  );
}
