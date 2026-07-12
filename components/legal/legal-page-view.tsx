import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import type { LegalSlug } from "@/lib/legal/constants";
import { getLegalPage } from "@/lib/legal/service";
import { formatMediaDate } from "@/lib/news-media/format";

interface LegalPageViewProps {
  slug: LegalSlug;
}

/** Shared layout of the public legal pages (privacy, terms, cookies, accessibility). */
export async function LegalPageView({ slug }: LegalPageViewProps) {
  const page = await getLegalPage(slug);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-10">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Legal</p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl">
            {page.title}
          </h1>
          {page.updatedAt ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Última atualização:{" "}
              <time dateTime={page.updatedAt}>{formatMediaDate(page.updatedAt)}</time>
            </p>
          ) : null}
        </header>

        <MarkdownRenderer content={page.content} />
      </main>
      <SiteFooter />
    </>
  );
}
