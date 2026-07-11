import { revalidatePath, revalidateTag } from "next/cache";
import { SITE_CONFIG_CACHE_TAG } from "@/lib/settings/service";

/**
 * The site config feeds the root layout metadata and the footer on every
 * page, so a save must drop the cached read and regenerate the whole tree.
 */
export function revalidateSiteConfig(): void {
  revalidateTag(SITE_CONFIG_CACHE_TAG, "max");
  revalidatePath("/", "layout");
}
