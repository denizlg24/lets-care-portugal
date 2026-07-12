import type { MetadataRoute } from "next";
import { listPublishedBlogs } from "@/lib/blog/service";
import { siteUrl } from "@/lib/site";

export const revalidate = 86400;

const SITEMAP_URL_LIMIT = 50_000;
const STATIC_SITEMAP_ENTRY_COUNT = 17;

function getStaticSitemapEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/sobre-nos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/media`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/media/news`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/media/newsletters`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/media/webinars`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/recursos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...(
      [
        "/recursos/relatorios",
        "/recursos/publicacoes-cientificas",
        "/recursos/policy-briefs",
        "/recursos/materiais-pedagogicos",
      ] as const
    ).map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    {
      url: `${siteUrl}/contactos`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...(["/privacidade", "/termos", "/cookies", "/acessibilidade"] as const).map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { blogs } = await listPublishedBlogs({
    limit: SITEMAP_URL_LIMIT - STATIC_SITEMAP_ENTRY_COUNT,
  });

  const posts: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `${siteUrl}/blog/${blog.slug}`,
    lastModified: new Date(blog.updatedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...getStaticSitemapEntries(), ...posts];
}
