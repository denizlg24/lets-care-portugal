import { revalidatePath } from "next/cache";
import { LEGAL_PAGE_META, type LegalSlug } from "@/lib/legal/constants";

/**
 * Regenerates a public legal page after an admin mutation so changes show up
 * immediately instead of waiting for the daily ISR window.
 */
export function revalidateLegalPath(slug: LegalSlug): void {
  revalidatePath(LEGAL_PAGE_META[slug].path);
}
