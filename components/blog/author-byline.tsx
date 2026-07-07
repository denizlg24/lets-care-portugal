import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/blog/format";
import { cn } from "@/lib/utils";
import type { IBlogAuthor } from "@/models/Blog";

interface AuthorBylineProps {
  authors: IBlogAuthor[];
  className?: string;
}

/** Overlapping avatars + author names, Medium-style. Links out when provided. */
export function AuthorByline({ authors, className }: AuthorBylineProps) {
  if (authors.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex -space-x-2">
        {authors.slice(0, 3).map((author) => (
          <Avatar key={author.name} className="ring-2 ring-background">
            <AvatarFallback className="bg-secondary/15 text-xs font-semibold text-secondary-foreground">
              {initials(author.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="min-w-0 text-sm leading-tight">
        <p className="font-medium text-foreground">
          {authors.map((author, index) => (
            <span key={author.name}>
              {index > 0 && <span className="text-muted-foreground">, </span>}
              {author.link ? (
                <a
                  href={author.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:text-primary hover:underline"
                >
                  {author.name}
                  <ExternalLink className="size-3 opacity-60" aria-hidden />
                </a>
              ) : (
                author.name
              )}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
