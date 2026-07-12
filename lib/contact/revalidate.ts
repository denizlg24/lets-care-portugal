import { revalidatePath } from "next/cache";

/**
 * Regenerates the public contact page after an admin edits the social or
 * contact links so changes show up immediately instead of waiting for the
 * daily ISR window.
 */
export function revalidateContactPaths(): void {
  revalidatePath("/contactos");
}
