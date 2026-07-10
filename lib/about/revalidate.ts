import { revalidatePath } from "next/cache";

/**
 * Regenerates the public about page after an admin edits the mission or the
 * team so changes show up immediately instead of waiting for the daily ISR
 * window.
 */
export function revalidateAboutPaths(): void {
  revalidatePath("/sobre-nos");
}
