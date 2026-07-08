import { NewsMediaManager } from "@/components/admin/news-media/news-media-manager";
import type { NewsItem, NewsletterItem, PhotoItem } from "@/components/admin/news-media/shared";
import { requireAdminPage } from "@/lib/admin/auth";
import { listNewsItems, listNewsletters, listProjectPhotos } from "@/lib/news-media/service";

export default async function AdminMediaPage() {
  await requireAdminPage();

  const [newsletters, photos, news] = await Promise.all([
    listNewsletters(),
    listProjectPhotos(),
    listNewsItems(),
  ]);

  const newsletterItems: NewsletterItem[] = newsletters.map((n) => ({
    id: n._id,
    title: n.title,
    publishedAt: new Date(n.publishedAt).toISOString(),
    fileUrl: n.fileUrl,
    storageFileId: n.storageFileId,
    fileSize: n.fileSize ?? null,
    visible: n.visible,
  }));

  const photoItems: PhotoItem[] = photos.map((p) => ({
    id: p._id,
    imageUrl: p.imageUrl,
    storageFileId: p.storageFileId,
    subtitle: p.subtitle ?? "",
    takenAt: p.takenAt ? new Date(p.takenAt).toISOString() : null,
    visible: p.visible,
  }));

  const newsItems: NewsItem[] = news.map((n) => ({
    id: n._id,
    imageUrl: n.imageUrl,
    storageFileId: n.storageFileId,
    title: n.title,
    description: n.description,
    date: new Date(n.date).toISOString(),
    externalUrl: n.externalUrl,
    visible: n.visible,
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Notícias & Media
        </p>
        <h1 className="text-xl font-semibold text-foreground">Notícias e media</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Gerir newsletters informativos, fotografias de projetos e notícias que aparecem na página
          pública.
        </p>
      </header>

      <NewsMediaManager newsletters={newsletterItems} photos={photoItems} news={newsItems} />
    </div>
  );
}
