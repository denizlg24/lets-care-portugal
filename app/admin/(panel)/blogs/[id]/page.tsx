import { PenLine } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogDetailsForm, type BlogDetailsInitial } from "@/components/admin/blog-details-form";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/admin/auth";
import { getBlogById } from "@/lib/blog/service";
import { isValidObjectId } from "@/lib/blog/utils";
import { cn } from "@/lib/utils";

type RouteParams = { params: Promise<{ id: string }> };

export default async function BlogDetailsPage({ params }: RouteParams) {
  await requireAdminPage();

  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  const blog = await getBlogById(id);
  if (!blog) notFound();

  const initial: BlogDetailsInitial = {
    id: blog._id,
    slug: blog.slug,
    excerpt: blog.excerpt,
    coverImage: blog.coverImage ?? "",
    tags: blog.tags ?? [],
    authors: (blog.authors ?? []).map((author) => ({
      name: author.name,
      email: author.email ?? "",
      link: author.link ?? "",
    })),
    references: (blog.references ?? []).map((reference) => ({
      label: reference.label,
      url: reference.url,
    })),
    status: blog.status,
    hasContent: Boolean(blog.content?.trim()),
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blogue</p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 truncate text-xl font-semibold text-foreground">
            {blog.title || "Sem título"}
          </h1>
          <Link
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            href={`/admin/write/${blog._id}`}
          >
            <PenLine data-icon="inline-start" />
            Editar conteúdo
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          Preencha os detalhes do artigo e publique quando estiver pronto.
        </p>
      </header>

      <BlogDetailsForm initial={initial} />
    </div>
  );
}
