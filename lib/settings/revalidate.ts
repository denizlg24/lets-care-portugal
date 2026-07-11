import { revalidatePath } from "next/cache";

/**
 * The site config feeds the root layout metadata and the footer on every
 * page, so a save regenerates the whole route tree.
 */
export function revalidateSiteConfig(): void {
  revalidatePath("/", "layout");
}
