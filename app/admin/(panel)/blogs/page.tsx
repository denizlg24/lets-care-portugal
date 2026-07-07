import { type BlogListItem, BlogManager } from "@/components/admin/blog-manager";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAllBlogViews, listBlogsAdmin } from "@/lib/blog/service";

export default async function AdminBlogsPage() {
  await requireAdminPage();

  const [{ blogs }, views] = await Promise.all([listBlogsAdmin({ limit: 100 }), getAllBlogViews()]);

  const items: BlogListItem[] = blogs.map((blog) => ({
    id: blog._id,
    title: blog.title,
    slug: blog.slug,
    status: blog.status,
    authors: blog.authors?.map((author) => author.name) ?? [],
    publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null,
    createdAt: new Date(blog.createdAt).toISOString(),
    views: views[blog._id] ?? 0,
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blogue</p>
        <h1 className="text-xl font-semibold text-foreground">Artigos do blogue</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Escreva, edite, publique e arquive os artigos do blogue.
        </p>
      </header>

      <BlogManager blogs={items} />
    </div>
  );
}
