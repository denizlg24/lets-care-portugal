import type { ElementType } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { siteUrl } from "@/lib/site";

/**
 * Restrictive schema: only inline formatting the footer/metadata prose needs.
 * Content is admin-authored, but sanitizing keeps a safety net (no scripts,
 * event handlers, images or block embeds).
 */
const inlineSchema = {
  ...defaultSchema,
  tagNames: ["a", "strong", "em", "b", "i", "u", "s", "del", "code", "br", "span"],
  attributes: {
    a: ["href", "title"],
    span: [],
  },
};

function isSiteHost(hostname: string): boolean {
  const siteHostname = new URL(siteUrl).hostname.toLowerCase();
  const normalized = hostname.toLowerCase();
  return normalized === siteHostname || normalized.endsWith(`.${siteHostname}`);
}

function isExternal(href?: string): boolean {
  if (!href) return false;
  try {
    const url = new URL(href, siteUrl);
    return (url.protocol === "http:" || url.protocol === "https:") && !isSiteHost(url.hostname);
  } catch {
    return false;
  }
}

const components: Components = {
  // Unwrap the block <p> react-markdown emits so the text renders inline inside
  // the caller's own styled element (see the `as` prop below).
  p: ({ children }) => <>{children}</>,
  a: ({ node: _node, href, children, ...props }) => {
    const external = isExternal(href);
    return (
      <a
        href={href}
        className="underline underline-offset-2 transition-colors hover:text-foreground"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
};

export interface InlineMarkdownProps {
  content: string;
  className?: string;
  /** Wrapper element rendered around the inline markdown. Defaults to `p`. */
  as?: ElementType;
}

/**
 * Renders a single line/paragraph of admin-authored markdown as inline content
 * (links + basic emphasis) inside a styled wrapper element. For prose that is
 * also reused in metadata, strip the markdown first with `stripMarkdown`.
 */
export function InlineMarkdown({ content, className, as: Wrapper = "p" }: InlineMarkdownProps) {
  return (
    <Wrapper className={className}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[[rehypeSanitize, inlineSchema]]}
        components={components}
      >
        {content}
      </Markdown>
    </Wrapper>
  );
}
