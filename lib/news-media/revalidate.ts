import { revalidatePath } from "next/cache";

/**
 * Regenerates the public media pages after an admin mutation so changes show
 * up immediately instead of waiting for the daily ISR window.
 */
export function revalidateMediaPaths(): void {
  revalidatePath("/media");
  revalidatePath("/media/news");
  revalidatePath("/media/newsletters");
  revalidatePath("/media/webinars");
}
