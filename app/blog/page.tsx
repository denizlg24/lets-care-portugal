import type { Metadata } from "next";
import Link from "next/link";
import { BlogCard } from "@/components/blog/blog-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { listPublishedBlogs } from "@/lib/blog/service";
import { cn } from "@/lib/utils";

export const revalidate = 86400;
const BLOG_PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artigos, reflexões e boas práticas sobre cuidados para pessoas mais velhas — do projeto LeTs Care Portugal.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Blog | LeTs Care Portugal",
    description: "Artigos, reflexões e boas práticas sobre cuidados para pessoas mais velhas.",
  },
};

interface BlogIndexPageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function blogPageHref(page: number): string {
  return page <= 1 ? "/blog" : `/blog?page=${page}`;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const params = await searchParams;
  const { blogs, page, pages, total } = await listPublishedBlogs({
    page: parsePageParam(params?.page),
    limit: BLOG_PAGE_SIZE,
  });

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Blog</p>
          <h1 className="mt-2 text-balance font-heading text-2xl sm:text-3xl font-extrabold leading-tight text-foreground md:text-4xl lg:text-5xl">
            Ideias e boas práticas sobre cuidados
          </h1>
          <p className="mt-4 max-w-xl text-pretty sm:text-lg text-base text-muted-foreground">
            Reflexões e aprendizagens do projeto LeTs Care Portugal sobre o futuro do
            envelhecimento.
          </p>
        </header>

        {total === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Ainda não há artigos publicados. Volte em breve.
          </p>
        ) : blogs.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Não há artigos nesta página.</p>
        ) : (
          <div>
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav
            className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"
            aria-label="Paginação do blogue"
          >
            <Link
              href={blogPageHref(Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                page <= 1 && "pointer-events-none opacity-50",
              )}
            >
              Anterior
            </Link>
            <span className="text-sm text-muted-foreground">
              Página {page} de {pages}
            </span>
            <Link
              href={blogPageHref(Math.min(pages, page + 1))}
              aria-disabled={page >= pages}
              tabIndex={page >= pages ? -1 : undefined}
              className={cn(
                buttonVariants({ size: "sm", variant: "outline" }),
                page >= pages && "pointer-events-none opacity-50",
              )}
            >
              Seguinte
            </Link>
          </nav>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
