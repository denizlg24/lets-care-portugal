"use client";

import { AlertCircle, ImageUp, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { BlogStatus } from "@/models/Blog";

export interface BlogFormAuthor {
  name: string;
  email: string;
  link: string;
}

export interface BlogFormReference {
  label: string;
  url: string;
}

export interface BlogDetailsInitial {
  id: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  tags: string[];
  authors: BlogFormAuthor[];
  references: BlogFormReference[];
  status: BlogStatus;
  hasContent: boolean;
}

const STATUS_OPTIONS: { value: BlogStatus; label: string }[] = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body });
  if (!response.ok) throw new Error("upload failed");
  const data = (await response.json()) as { url: string };
  return data.url;
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <Label className="text-sm font-medium" htmlFor={htmlFor}>
      {children}
    </Label>
  );
}

export function BlogDetailsForm({ initial }: { initial: BlogDetailsInitial }) {
  const router = useRouter();

  const [slug, setSlug] = useState(initial.slug);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [coverImage, setCoverImage] = useState(initial.coverImage);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [authors, setAuthors] = useState<BlogFormAuthor[]>(initial.authors);
  const [references, setReferences] = useState<BlogFormReference[]>(initial.references);
  const [status, setStatus] = useState<BlogStatus>(initial.status);

  const [coverUploading, setCoverUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function addTagFromDraft() {
    const value = tagDraft.trim().replace(/,$/, "").trim();
    if (value && !tags.includes(value)) setTags((prev) => [...prev, value]);
    setTagDraft("");
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTagFromDraft();
    } else if (event.key === "Backspace" && !tagDraft && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  async function handleCoverPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      setCoverImage(await uploadImage(file));
    } catch {
      setError("Não foi possível carregar a imagem de capa.");
    } finally {
      setCoverUploading(false);
    }
  }

  function updateAuthor(index: number, patch: Partial<BlogFormAuthor>) {
    setAuthors((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function updateReference(index: number, patch: Partial<BlogFormReference>) {
    setReferences((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Publishing has stricter requirements than saving a draft.
    if (status === "published") {
      if (!excerpt.trim()) {
        setError("Adicione um resumo antes de publicar.");
        return;
      }
      if (!initial.hasContent) {
        setError("O artigo não tem conteúdo. Volte a “Editar conteúdo” antes de publicar.");
        return;
      }
    }

    const cleanedAuthors = authors
      .map((a) => ({ name: a.name.trim(), email: a.email.trim(), link: a.link.trim() }))
      .filter((a) => a.name)
      .map((a) => ({
        name: a.name,
        ...(a.email ? { email: a.email } : {}),
        ...(a.link ? { link: a.link } : {}),
      }));

    const cleanedReferences = references
      .map((r) => ({ label: r.label.trim(), url: r.url.trim() }))
      .filter((r) => r.label && r.url);

    const trimmedSlug = slug.trim();
    const payload = {
      excerpt: excerpt.trim(),
      status,
      tags,
      authors: cleanedAuthors,
      references: cleanedReferences,
      coverImage: coverImage.trim() || null,
      ...(trimmedSlug && trimmedSlug !== initial.slug ? { slug: trimmedSlug } : {}),
    };

    setPending(true);
    try {
      const response = await fetch(`/api/admin/blogs/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Não foi possível guardar. Verifique os campos.");
        return;
      }
      router.push("/admin/blogs");
      router.refresh();
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  // "Publicar" only for the first publish; an already-published post updates.
  const saveLabel =
    status === "published"
      ? initial.status === "published"
        ? "Atualizar"
        : "Publicar"
      : "Guardar";

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="flex items-center justify-end gap-2">
        <NativeSelect
          size="sm"
          aria-label="Estado"
          value={status}
          onChange={(event) => setStatus(event.target.value as BlogStatus)}
        >
          {STATUS_OPTIONS.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" size="sm" disabled={pending || coverUploading}>
          <Save data-icon="inline-start" />
          {pending ? "A guardar…" : saveLabel}
        </Button>
      </div>

      {error ? (
        <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}

      <section className="space-y-5">
        <div className="space-y-1.5">
          <FieldLabel htmlFor="excerpt">Resumo</FieldLabel>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="Uma frase curta que resume o artigo (aparece nas listagens)."
            maxLength={1000}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">Obrigatório para publicar.</p>
        </div>

        <div className="space-y-1.5">
          <FieldLabel htmlFor="slug">Endereço (slug)</FieldLabel>
          <Input
            id="slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            maxLength={120}
          />
        </div>
      </section>

      <section className="space-y-2">
        <FieldLabel>Imagem de capa</FieldLabel>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCoverPicked}
        />
        {coverImage ? (
          <div className="space-y-2">
            {/* biome-ignore lint/performance/noImgElement: admin-only preview thumbnail */}
            <img
              src={coverImage}
              alt="Pré-visualização da capa"
              className="max-h-56 w-full rounded-lg border border-border object-cover"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={coverUploading}
                onClick={() => coverInputRef.current?.click()}
              >
                <ImageUp data-icon="inline-start" />
                Substituir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setCoverImage("")}
              >
                <X data-icon="inline-start" />
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={coverUploading}
            onClick={() => coverInputRef.current?.click()}
          >
            <ImageUp data-icon="inline-start" />
            {coverUploading ? "A carregar…" : "Carregar imagem"}
          </Button>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Autores</FieldLabel>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setAuthors((prev) => [...prev, { name: "", email: "", link: "" }])}
          >
            <Plus data-icon="inline-start" />
            Adicionar autor
          </Button>
        </div>
        {authors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem autores. Adicione o nome de quem escreveu o artigo (email e link são opcionais).
          </p>
        ) : (
          <div className="space-y-3">
            {authors.map((author, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
                key={index}
                className="space-y-2 rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={author.name}
                    onChange={(event) => updateAuthor(index, { name: event.target.value })}
                    placeholder="Nome"
                    maxLength={120}
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Remover autor"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => setAuthors((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="email"
                    value={author.email}
                    onChange={(event) => updateAuthor(index, { email: event.target.value })}
                    placeholder="Email (opcional)"
                    maxLength={254}
                  />
                  <Input
                    type="url"
                    value={author.link}
                    onChange={(event) => updateAuthor(index, { link: event.target.value })}
                    placeholder="Link (opcional)"
                    maxLength={2048}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <FieldLabel htmlFor="tags">Etiquetas</FieldLabel>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
            >
              {tag}
              <button
                type="button"
                aria-label={`Remover ${tag}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            id="tags"
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTagFromDraft}
            placeholder={tags.length ? "" : "Escreva e prima Enter"}
            className="min-w-24 flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Referências</FieldLabel>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setReferences((prev) => [...prev, { label: "", url: "" }])}
          >
            <Plus data-icon="inline-start" />
            Adicionar referência
          </Button>
        </div>
        {references.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem referências. Adicione fontes ou leituras relacionadas.
          </p>
        ) : (
          <div className="space-y-2">
            {references.map((reference, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
                key={index}
                className="flex items-center gap-2"
              >
                <Input
                  value={reference.label}
                  onChange={(event) => updateReference(index, { label: event.target.value })}
                  placeholder="Descrição"
                  maxLength={200}
                />
                <Input
                  type="url"
                  value={reference.url}
                  onChange={(event) => updateReference(index, { url: event.target.value })}
                  placeholder="https://…"
                  maxLength={2048}
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remover referência"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => setReferences((prev) => prev.filter((_, i) => i !== index))}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </form>
  );
}
