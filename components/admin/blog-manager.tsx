"use client";

import { Eye, PenLine, Plus, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BlogStatus } from "@/models/Blog";

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  authors: string[];
  publishedAt: string | null;
  createdAt: string;
  views: number;
}

interface BlogManagerProps {
  blogs: BlogListItem[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const STATUS: Record<BlogStatus, { label: string; variant: "default" | "secondary" | "outline" }> =
  {
    published: { label: "Publicado", variant: "default" },
    draft: { label: "Rascunho", variant: "outline" },
    archived: { label: "Arquivado", variant: "secondary" },
  };

export function BlogManager({ blogs }: BlogManagerProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(blog: BlogListItem) {
    if (!window.confirm(`Eliminar “${blog.title}”? Esta ação não pode ser anulada.`)) {
      return;
    }
    setError(null);
    setDeletingId(blog.id);
    try {
      const response = await fetch(`/api/admin/blogs/${blog.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Não foi possível eliminar o artigo.");
        return;
      }
      router.refresh();
    } catch {
      setError("Não foi possível eliminar o artigo.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Artigos</h2>
          <span className="text-xs text-muted-foreground">{blogs.length}</span>
        </div>
        <Link className={cn(buttonVariants({ size: "sm" }))} href="/admin/write">
          <Plus data-icon="inline-start" />
          Escrever artigo
        </Link>
      </div>

      {error ? (
        <p className="border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}

      {blogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <PenLine className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">Ainda não há artigos</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece por escrever o primeiro artigo do blogue.
          </p>
          <Link
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-4")}
            href="/admin/write"
          >
            <Plus data-icon="inline-start" />
            Escrever artigo
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Artigo
                </th>
                <th className="py-2 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Estado
                </th>
                <th className="hidden py-2 pr-4 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:table-cell">
                  Publicado
                </th>
                <th className="py-2 pr-4 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Vistas
                </th>
                <th className="py-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => {
                const status = STATUS[blog.status];
                return (
                  <tr key={blog.id} className="border-b border-border align-top last:border-0">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/write/${blog.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {blog.title || "Sem título"}
                      </Link>
                      <div className="truncate text-xs text-muted-foreground">
                        {blog.authors.length ? blog.authors.join(", ") : `/${blog.slug}`}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="hidden whitespace-nowrap py-3 pr-4 text-muted-foreground sm:table-cell">
                      {blog.publishedAt ? formatDate(blog.publishedAt) : "—"}
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-right tabular-nums text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3.5" />
                        {blog.views}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                          href={`/admin/write/${blog.id}`}
                        >
                          <PenLine data-icon="inline-start" />
                          Escrever
                        </Link>
                        <Link
                          className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                          href={`/admin/blogs/${blog.id}`}
                        >
                          <Settings2 data-icon="inline-start" />
                          Detalhes
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === blog.id}
                          onClick={() => handleDelete(blog)}
                        >
                          <Trash2 data-icon="inline-start" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
