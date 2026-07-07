import { ArrowLeft, Clock } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthorByline } from "@/components/blog/author-byline";
import { CommentsSection } from "@/components/blog/comments-section";
import { ShareButton } from "@/components/blog/share-button";
import { ViewCounter } from "@/components/blog/view-counter";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Button } from "@/components/ui/button";
import { formatBlogDate } from "@/lib/blog/format";
import { getBlogViews, getPublishedBlogBySlug, listPublishedSlugs } from "@/lib/blog/service";
import { siteConfig, siteUrl } from "@/lib/site";

export const revalidate = 86400;

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

type RouteParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) return { title: "Artigo não encontrado" };

  const url = `/blog/${blog.slug}`;
  const images = blog.coverImage ? [{ url: blog.coverImage, alt: blog.title }] : undefined;

  return {
    title: blog.title,
    description: blog.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: blog.title,
      description: blog.excerpt,
      publishedTime: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(blog.updatedAt).toISOString(),
      authors: blog.authors.map((author) => author.name),
      tags: blog.tags,
      images,
    },
    twitter: {
      card: blog.coverImage ? "summary_large_image" : "summary",
      title: blog.title,
      description: blog.excerpt,
      images: blog.coverImage ? [blog.coverImage] : undefined,
    },
  };
}

export default async function BlogDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) notFound();

  const views = await getBlogViews(blog._id);
  const shareUrl = `${siteUrl}/blog/${blog.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.coverImage ? [blog.coverImage] : undefined,
    datePublished: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : undefined,
    dateModified: new Date(blog.updatedAt).toISOString(),
    author: blog.authors.map((author) => ({
      "@type": "Person",
      name: author.name,
      url: author.link,
    })),
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
    keywords: blog.tags.join(", "),
  };
  const jsonLdHtml = JSON.stringify(jsonLd);

  return (
    <>
      <SiteHeader />
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: server-generated JSON-LD, not user input */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />

      <main className="mx-auto w-full flex-1 px-6 py-12 md:py-16 max-w-3xl">
        <nav className="mb-8">
          <Button
            nativeButton={false}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            render={
              <Link href="/blog">
                <ArrowLeft /> Todos os artigos
              </Link>
            }
          ></Button>
        </nav>

        <header>
          {blog.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary/12 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-balance font-heading text-3xl font-extrabold leading-tight text-foreground md:text-5xl">
            {blog.title}
          </h1>

          {blog.excerpt && (
            <p className="mt-4 text-pretty text-xl leading-relaxed text-muted-foreground">
              {blog.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
            <AuthorByline authors={blog.authors} />
            <ShareButton url={shareUrl} title={blog.title} excerpt={blog.excerpt} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {blog.publishedAt && (
              <time dateTime={new Date(blog.publishedAt).toISOString()}>
                {formatBlogDate(blog.publishedAt)}
              </time>
            )}
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {blog.timeToRead} min de leitura
            </span>
            <span aria-hidden>·</span>
            <ViewCounter blogId={blog._id} initialViews={views} />
          </div>
        </header>

        {blog.coverImage && (
          <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-xl bg-muted">
            <Image
              src={blog.coverImage}
              alt={blog.title}
              fill
              priority
              sizes="(max-width: 704px) 100vw, 704px"
              className="object-cover"
            />
          </div>
        )}

        <MarkdownRenderer content={blog.content} className="mt-10" />

        {blog.references.length > 0 && (
          <section
            aria-labelledby="references-heading"
            className="mt-14 border-t border-border pt-8"
          >
            <h2 id="references-heading" className="font-heading text-lg font-bold text-foreground">
              Referências
            </h2>
            <ol className="mt-4 space-y-2 text-sm">
              {blog.references.map((reference, index) => (
                <li key={reference.url} className="flex gap-2 text-muted-foreground">
                  <span className="shrink-0">[{index + 1}]</span>
                  <a
                    href={reference.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="wrap-break-word text-foreground underline underline-offset-2 hover:text-primary"
                  >
                    {reference.label}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        )}

        <CommentsSection blogId={blog._id} />
      </main>
      <SiteFooter />
    </>
  );
}
