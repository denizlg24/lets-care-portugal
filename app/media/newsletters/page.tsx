import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NewsletterItem } from "@/components/media/newsletter-item";
import { buttonVariants } from "@/components/ui/button";
import { listVisibleNewsletters } from "@/lib/news-media/service";
import { cn } from "@/lib/utils";

export const revalidate = 86400;
const NEWSLETTER_PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Newsletters",
  description:
    "Todas as edições da newsletter do projeto LeTs-Care Portugal, disponíveis para descarregar em PDF.",
  alternates: { canonical: "/media/newsletters" },
  openGraph: {
    type: "website",
    url: "/media/newsletters",
    title: "Newsletters | LeTs-Care Portugal",
    description: "Todas as edições da newsletter do projeto, disponíveis para descarregar em PDF.",
  },
};

interface NewsletterIndexPageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function newsletterPageHref(page: number): string {
  return page <= 1 ? "/media/newsletters" : `/media/newsletters?page=${page}`;
}

export default async function NewsletterIndexPage({ searchParams }: NewsletterIndexPageProps) {
  const params = await searchParams;
  const { items, page, pages, total } = await listVisibleNewsletters({
    page: parsePageParam(params?.page),
    limit: NEWSLETTER_PAGE_SIZE,
  });

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
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Newsletters</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Todas as newsletters
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Todas as edições da newsletter do projeto, disponíveis para descarregar em PDF.
          </p>
        </header>

        {total === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Ainda não há newsletters disponíveis. Volte em breve.
          </p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Não há newsletters nesta página.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((newsletter) => (
              <NewsletterItem key={newsletter._id} newsletter={newsletter} />
            ))}
          </ul>
        )}

        {pages > 1 ? (
          <nav
            className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"
            aria-label="Paginação das newsletters"
          >
            <Link
              href={newsletterPageHref(Math.max(1, page - 1))}
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
              href={newsletterPageHref(Math.min(pages, page + 1))}
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
