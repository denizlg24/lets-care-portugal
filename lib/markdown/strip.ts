/**
 * Reduces admin-authored markdown to plain text for use in metadata (page
 * titles, descriptions, Open Graph / Twitter tags) where raw markdown syntax
 * would leak into the rendered output. Handles the inline constructs the site
 * config fields realistically use — links, emphasis, code, headings — not the
 * full CommonMark grammar.
 */
export function stripMarkdown(input: string): string {
  return (
    input
      // Images: ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Links: [text](url) -> text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // Bold / italic / strikethrough markers
      .replace(/(\*\*|__)(.*?)\1/g, "$2")
      .replace(/(\*|_)(.*?)\1/g, "$2")
      .replace(/~~(.*?)~~/g, "$1")
      // Inline code
      .replace(/`([^`]*)`/g, "$1")
      // Leading heading / blockquote / list markers, per line
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/^\s{0,3}[-*+]\s+/gm, "")
      // Collapse whitespace introduced by removed line markers
      .replace(/\s+/g, " ")
      .trim()
  );
}
