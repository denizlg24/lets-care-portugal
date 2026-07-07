import "katex/dist/katex.min.css";

import type { ComponentProps } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";
import { MarkdownImage } from "./markdown-image";

/**
 * Sanitize schema extended so KaTeX (inline styles + classes) and GFM markup
 * survive, while scripts / event handlers are still stripped. Content is
 * authored by trusted admins, but sanitizing raw HTML keeps a safety net.
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "className", "style", "aria-hidden"],
    input: [...(defaultSchema.attributes?.input ?? []), "checked", "disabled", "type"],
    // KaTeX draws radicals (√) and other stretchy glyphs as inline SVG; without
    // these the surd disappears in the published view (but shows in the editor,
    // which doesn't sanitize).
    svg: ["xmlns", "width", "height", "viewBox", "preserveAspectRatio", "focusable"],
    path: ["d"],
    line: ["x1", "y1", "x2", "y2", "strokeWidth"],
  },
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    // Inline formatting the editor can emit but the default schema strips.
    "u",
    "ins",
    "mark",
    "sub",
    "sup",
    "kbd",
    "abbr",
    // KaTeX MathML output
    "math",
    "semantics",
    "annotation",
    "mrow",
    "mi",
    "mo",
    "mn",
    "msup",
    "msub",
    "msubsup",
    "mfrac",
    "msqrt",
    "mroot",
    "mstyle",
    "mtable",
    "mtr",
    "mtd",
    "mspace",
    "mtext",
    "munder",
    "mover",
    "munderover",
    // KaTeX HTML radical/stretchy glyphs
    "svg",
    "path",
    "line",
  ],
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
  img: ({ src, alt, title }) => (
    <MarkdownImage src={typeof src === "string" ? src : undefined} alt={alt} title={title} />
  ),
  a: ({ node: _node, href, children, ...props }) => {
    const external = isExternal(href);
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
  // Wrap tables in a scroll container so wide tables scroll instead of
  // overflowing the page — without breaking column layout (a `display:block`
  // table would collapse its columns).
  table: ({ node: _node, ...props }) => (
    <div className="md-table-wrap">
      <table {...props} />
    </div>
  ),
};

// KaTeX must never crash the whole post: render a bad formula in error color
// (throwOnError:false) and ignore non-fatal LaTeX quirks like `\\` in display
// mode (strict:false) instead of throwing.
const katexOptions = { strict: false as const, throwOnError: false };

export type MarkdownRendererProps = {
  content: string;
  className?: string;
} & Omit<ComponentProps<"div">, "content">;

/**
 * Renders a markdown blog post in the shared `.markdown-body` prose style.
 * Supports GFM (tables, task lists, strikethrough, autolinks), math (KaTeX),
 * soft line breaks, and sanitized raw HTML. Server-renderable.
 */
export function MarkdownRenderer({ content, className, ...props }: MarkdownRendererProps) {
  return (
    <div className={cn("markdown-body", className)} {...props}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeRaw, [rehypeKatex, katexOptions], [rehypeSanitize, schema]]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  );
}
