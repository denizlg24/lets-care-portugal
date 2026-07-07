import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatBlogDateShort } from "@/lib/blog/format";
import type { ILeanBlog } from "@/models/Blog";

interface BlogCardProps {
  blog: ILeanBlog;
}

/**
 * A single post in the listing. Minimalist Medium-style row: text on the left,
 * an optional thumbnail on the right — no heavy card chrome.
 */
export function BlogCard({ blog }: BlogCardProps) {
  const authorNames = blog.authors.map((author) => author.name).join(", ");

  return (
    <article className="group border-b border-border py-8 first:pt-0">
      <Link href={`/blog/${blog.slug}`} className="flex items-start gap-6 sm:gap-8">
        <div className="min-w-0 flex-1">
          {authorNames && (
            <p className="mb-2 text-sm font-medium text-muted-foreground">{authorNames}</p>
          )}
          <h2 className="text-balance font-heading text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-2xl">
            {blog.title}
          </h2>
          {blog.excerpt && (
            <p className="mt-2 line-clamp-2 text-pretty text-muted-foreground">{blog.excerpt}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {blog.publishedAt && (
              <time dateTime={new Date(blog.publishedAt).toISOString()}>
                {formatBlogDateShort(blog.publishedAt)}
              </time>
            )}
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {blog.timeToRead} min
            </span>
            {blog.tags.slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {blog.coverImage && (
          <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
            <Image
              src={blog.coverImage}
              alt=""
              fill
              sizes="(max-width: 640px) 112px, 160px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
      </Link>
    </article>
  );
}
