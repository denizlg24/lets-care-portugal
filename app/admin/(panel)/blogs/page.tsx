import { type BlogListItem, BlogManager } from "@/components/admin/blog-manager";
import { requireAdminPage } from "@/lib/admin/auth";
import { getAllBlogViews, listBlogsAdmin } from "@/lib/blog/service";

const ADMIN_BLOG_PAGE_SIZE = 20;

interface AdminBlogsPageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function AdminBlogsPage({ searchParams }: AdminBlogsPageProps) {
  await requireAdminPage();

  const params = await searchParams;
  const requestedPage = parsePageParam(params?.page);
  const [{ blogs, page, pages, total }, views] = await Promise.all([
    listBlogsAdmin({ page: requestedPage, limit: ADMIN_BLOG_PAGE_SIZE }),
    getAllBlogViews(),
  ]);

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

      <BlogManager blogs={items} page={page} pages={pages} total={total} />
    </div>
  );
}
