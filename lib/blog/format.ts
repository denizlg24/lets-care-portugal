import { format } from "date-fns";
import { pt } from "date-fns/locale";

/** "7 de julho de 2026" — Portuguese long date. */
export function formatBlogDate(date: string | Date): string {
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: pt });
}

/** "7 jul 2026" — compact date for cards. */
export function formatBlogDateShort(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: pt });
}

const compact = new Intl.NumberFormat("pt-PT", { notation: "compact" });

/** Compact view count, e.g. 1234 -> "1,2 mil". */
export function formatViews(views: number): string {
  return compact.format(views);
}

/** Initials for an avatar fallback ("Ana Silva" -> "AS"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
