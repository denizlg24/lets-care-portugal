import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NewsItemCard } from "@/components/media/news-item-card";
import { buttonVariants } from "@/components/ui/button";
import { listVisibleNewsItems } from "@/lib/news-media/service";
import { cn } from "@/lib/utils";

export const revalidate = 86400;
const NEWS_PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Notícias",
  description:
    "Todas as notícias sobre o projeto LeTs-Care Portugal na comunicação social, por ordem cronológica.",
  alternates: { canonical: "/media/news" },
  openGraph: {
    type: "website",
    url: "/media/news",
    title: "Notícias | LeTs-Care Portugal",
    description: "Todas as notícias sobre o projeto LeTs-Care Portugal na comunicação social.",
  },
};

interface NewsIndexPageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function newsPageHref(page: number): string {
  return page <= 1 ? "/media/news" : `/media/news?page=${page}`;
}

export default async function NewsIndexPage({ searchParams }: NewsIndexPageProps) {
  const params = await searchParams;
  const { items, page, pages, total } = await listVisibleNewsItems({
    page: parsePageParam(params?.page),
    limit: NEWS_PAGE_SIZE,
  });

  if (page > pages) {
    redirect(newsPageHref(pages));
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <Link
            href="/media"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Notícias e Media
          </Link>
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Notícias</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Todas as notícias
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            A presença do projeto LeTs-Care Portugal na comunicação social, por ordem cronológica.
          </p>
        </header>

        {total === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Ainda não há notícias publicadas. Volte em breve.
          </p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Não há notícias nesta página.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <NewsItemCard key={item._id} item={item} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav
            className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"
            aria-label="Paginação das notícias"
          >
            <Link
              href={newsPageHref(Math.max(1, page - 1))}
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
              href={newsPageHref(Math.min(pages, page + 1))}
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
