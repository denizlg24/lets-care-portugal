import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PedagogicCard } from "@/components/resources/pedagogic-card";
import { ResourceCard } from "@/components/resources/resource-card";
import { buttonVariants } from "@/components/ui/button";
import { RESOURCE_TYPE_META, type ResourceType } from "@/lib/resources/constants";
import { listVisibleResourcesByType } from "@/lib/resources/service";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

interface ResourcesIndexPageProps {
  type: ResourceType;
  searchParams?: Promise<{ page?: string | string[] }>;
}

/**
 * The shared "see all resources of one type" page, paginated. Each
 * /recursos/[sectionId] route is a thin wrapper that supplies its type and
 * page-level metadata; this renders the actual list.
 */
export async function ResourcesIndexPage({ type, searchParams }: ResourcesIndexPageProps) {
  const meta = RESOURCE_TYPE_META[type];
  const basePath = `/recursos/${meta.sectionId}`;
  const pageHref = (target: number) => (target <= 1 ? basePath : `${basePath}?page=${target}`);

  const params = await searchParams;
  const { items, page, pages, total } = await listVisibleResourcesByType({
    type,
    page: parsePageParam(params?.page),
    limit: PAGE_SIZE,
  });

  if (page > pages) {
    redirect(pageHref(pages));
  }

  const pedagogic = type === "pedagogic";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <Link
            href="/recursos"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Recursos
          </Link>
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Recursos</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {meta.label}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            {meta.indexDescription}
          </p>
        </header>

        {total === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Ainda não há materiais disponíveis nesta secção. Volte em breve.
          </p>
        ) : items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Não há materiais nesta página.</p>
        ) : pedagogic ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((resource) => (
              <PedagogicCard key={resource._id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        )}

        {pages > 1 ? (
          <nav
            className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"
            aria-label="Paginação dos recursos"
          >
            <Link
              href={pageHref(Math.max(1, page - 1))}
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
              href={pageHref(Math.min(pages, page + 1))}
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
