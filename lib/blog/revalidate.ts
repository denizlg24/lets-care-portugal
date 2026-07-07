import { revalidatePath } from "next/cache";

/**
 * Flushes the ISR cache for the public blog surface after a create/update/
 * delete. The listing and sitemap always change; pass every affected slug
 * (including the previous slug on a rename) to refresh the detail pages too.
 */
export function revalidateBlogPaths(...slugs: (string | undefined | null)[]): void {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/blog/${slug}`);
  }
}
