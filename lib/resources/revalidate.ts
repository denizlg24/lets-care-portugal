import { revalidatePath } from "next/cache";
import { RESOURCE_TYPE_META, RESOURCE_TYPES } from "@/lib/resources/constants";

/**
 * Regenerates the public resources overview and every per-type "see all" page
 * after an admin mutation so changes show up immediately instead of waiting for
 * the daily ISR window.
 */
export function revalidateResourcePaths(): void {
  revalidatePath("/recursos");
  for (const type of RESOURCE_TYPES) {
    revalidatePath(`/recursos/${RESOURCE_TYPE_META[type].sectionId}`);
  }
}
