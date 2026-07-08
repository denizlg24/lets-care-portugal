import { NewsMediaManager } from "@/components/admin/news-media/news-media-manager";
import {
  normalizeNews,
  normalizeNewsletter,
  normalizePhoto,
} from "@/components/admin/news-media/shared";
import { requireAdminPage } from "@/lib/admin/auth";
import { listNewsItems, listNewsletters, listProjectPhotos } from "@/lib/news-media/service";

export default async function AdminMediaPage() {
  await requireAdminPage();

  const [newsletters, photos, news] = await Promise.all([
    listNewsletters(),
    listProjectPhotos(),
    listNewsItems(),
  ]);

  // Reuse the shared normalizers so freshly created/updated rows in the client
  // managers keep the exact same shape as the server-rendered ones.
  const newsletterItems = newsletters.map(normalizeNewsletter);
  const photoItems = photos.map(normalizePhoto);
  const newsItems = news.map(normalizeNews);

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
