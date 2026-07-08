import { format } from "date-fns";
import { pt } from "date-fns/locale";

/** "7 de julho de 2026" — Portuguese long date. */
export function formatMediaDate(date: string | Date): string {
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: pt });
}

/** "7 jul 2026" — compact date for cards. */
export function formatMediaDateShort(date: string | Date): string {
  return format(new Date(date), "d MMM yyyy", { locale: pt });
}

/** Human-readable file size, e.g. "2.4 MB". */
export function formatFileSize(bytes: number | null | undefined): string | null {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
