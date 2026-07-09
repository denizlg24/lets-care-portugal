import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { NewsItemCard } from "@/components/media/news-item-card";
import { NewsletterItem } from "@/components/media/newsletter-item";
import { PhotoGallery } from "@/components/media/photo-gallery";
import {
  listProjectPhotos,
  listVisibleNewsItems,
  listVisibleNewsletters,
} from "@/lib/news-media/service";

export const revalidate = 86400;
const LATEST_COUNT = 3;

export const metadata: Metadata = {
  title: "Notícias e Media",
  description:
    "Notícias na imprensa, newsletters para descarregar e a galeria de fotografias do projeto LeTs-Care Portugal.",
  alternates: { canonical: "/media" },
  openGraph: {
    type: "website",
    url: "/media",
    title: "Notícias e Media | LeTs-Care Portugal",
    description:
      "Notícias na imprensa, newsletters para descarregar e a galeria de fotografias do projeto.",
  },
};

interface SectionHeadingProps {
  id: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}

function SectionHeading({ id, title, viewAllHref, viewAllLabel }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <h2 id={id} className="font-heading text-xl font-bold text-foreground sm:text-2xl">
        {title}
      </h2>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary transition-colors hover:text-primary"
        >
          {viewAllLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export default async function MediaPage() {
  const [news, newsletters, photos] = await Promise.all([
    listVisibleNewsItems({ page: 1, limit: LATEST_COUNT }),
    listVisibleNewsletters({ page: 1, limit: LATEST_COUNT }),
    listProjectPhotos({ onlyVisible: true }),
  ]);

  const galleryImages = photos.map((photo) => ({
    src: photo.imageUrl,
    alt: photo.subtitle || "Fotografia do projeto LeTs-Care Portugal",
    caption: photo.subtitle,
  }));

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">
            Notícias e Media
          </p>
          <h1 className="mt-2 text-balance font-heading text-2xl font-extrabold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            O projeto na imprensa e em imagens
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Acompanhe as notícias sobre o projeto LeTs-Care Portugal, descarregue as nossas
            newsletters e explore a galeria de fotografias.
          </p>
        </header>

        <section aria-labelledby="ultimas-noticias" className="mb-16">
          <SectionHeading
            id="ultimas-noticias"
            title="Últimas notícias"
            viewAllHref={news.total > LATEST_COUNT ? "/media/news" : undefined}
            viewAllLabel="Ver todas as notícias"
          />
          {news.items.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              Ainda não há notícias publicadas. Volte em breve.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.items.map((item) => (
                <NewsItemCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="newsletters" className="mb-16">
          <SectionHeading
            id="newsletters"
            title="Newsletters"
            viewAllHref={newsletters.total > LATEST_COUNT ? "/media/newsletters" : undefined}
            viewAllLabel="Ver todas as newsletters"
          />
          {newsletters.items.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              Ainda não há newsletters disponíveis. Volte em breve.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {newsletters.items.map((newsletter) => (
                <NewsletterItem key={newsletter._id} newsletter={newsletter} />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="galeria">
          <SectionHeading id="galeria" title="Galeria de fotografias" />
          {galleryImages.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              Ainda não há fotografias na galeria. Volte em breve.
            </p>
          ) : (
            <PhotoGallery images={galleryImages} />
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
