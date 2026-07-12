import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WebinarCard } from "@/components/media/webinar-card";
import { buttonVariants } from "@/components/ui/button";
import { listVisibleWebinars } from "@/lib/news-media/service";
import { cn } from "@/lib/utils";

export const revalidate = 86400;
const WEBINARS_PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Webinars",
  description:
    "Todos os webinars do projeto LeTs-Care Portugal, disponíveis no YouTube, por ordem cronológica.",
  alternates: { canonical: "/media/webinars" },
  openGraph: {
    type: "website",
    url: "/media/webinars",
    title: "Webinars | LeTs-Care Portugal",
    description: "Todos os webinars do projeto LeTs-Care Portugal, disponíveis no YouTube.",
  },
};

interface WebinarsIndexPageProps {
  searchParams?: Promise<{ page?: string | string[] }>;
}

function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function webinarsPageHref(page: number): string {
  return page <= 1 ? "/media/webinars" : `/media/webinars?page=${page}`;
}

export default async function WebinarsIndexPage({ searchParams }: WebinarsIndexPageProps) {
  const params = await searchParams;
  const { items, page, pages, total } = await listVisibleWebinars({
    page: parsePageParam(params?.page),
    limit: WEBINARS_PAGE_SIZE,
  });

  if (page > pages) {
    redirect(webinarsPageHref(pages));
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
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Webinars</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl">
            Todos os webinars
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            As sessões online do projeto LeTs-Care Portugal, gravadas e disponíveis no YouTube, por
            ordem cronológica.
          </p>
        </header>

        {total === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Ainda não há webinars disponíveis. Volte em breve.
          </p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Não há webinars nesta página.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((webinar) => (
              <WebinarCard key={webinar._id} webinar={webinar} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav
            className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"
            aria-label="Paginação dos webinars"
          >
            <Link
              href={webinarsPageHref(Math.max(1, page - 1))}
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
              href={webinarsPageHref(Math.min(pages, page + 1))}
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
