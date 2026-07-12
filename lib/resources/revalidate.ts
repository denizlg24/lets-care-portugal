import { revalidatePath } from "next/cache";

/**
 * Regenerates the public resources page after an admin mutation so changes
 * show up immediately instead of waiting for the daily ISR window.
 */
export function revalidateResourcePaths(): void {
  revalidatePath("/recursos");
}
