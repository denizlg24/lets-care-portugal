import { revalidatePath, revalidateTag } from "next/cache";
import { ABOUT_SETTINGS_CACHE_TAG } from "@/lib/about/service";

/**
 * Regenerates the public about page after an admin edits the sections or the
 * team so changes show up immediately instead of waiting for the daily ISR
 * window. The tag also drops the `unstable_cache` entry read by the admin.
 */
export function revalidateAboutPaths(): void {
  revalidateTag(ABOUT_SETTINGS_CACHE_TAG, "max");
  revalidatePath("/sobre-nos");
}
