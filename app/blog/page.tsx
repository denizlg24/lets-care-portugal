import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/blog-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { listPublishedBlogs } from "@/lib/blog/service";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artigos, reflexões e boas práticas sobre cuidados para pessoas mais velhas — do projeto LeTs Care Portugal.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: "Blog | LeTs Care Portugal",
    description: "Artigos, reflexões e boas práticas sobre cuidados para pessoas mais velhas.",
  },
};

export default async function BlogIndexPage() {
  const { blogs } = await listPublishedBlogs({ limit: 50 });

  return (
    <>
      <SiteHeader solid />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 md:py-20">
        <header className="mb-12">
          <p className="text-sm font-bold uppercase tracking-wider text-secondary">Blog</p>
          <h1 className="mt-2 text-balance font-heading text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
            Ideias e boas práticas sobre cuidados
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-lg text-muted-foreground">
            Reflexões e aprendizagens do projeto LeTs Care Portugal sobre o futuro do
            envelhecimento.
          </p>
        </header>

        {blogs.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Ainda não há artigos publicados. Volte em breve.
          </p>
        ) : (
          <div>
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
