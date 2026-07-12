"use client";

import {
  AlertCircle,
  Download,
  ExternalLink,
  FileText,
  FileUp,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import {
  formatDate,
  formatFileSize,
  fromDateInputValue,
  toDateInputValue,
} from "@/components/admin/news-media/shared";
import {
  normalizeResource,
  type RawResource,
  type ResourceItem,
  uploadResourceFile,
} from "@/components/admin/resources/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RESOURCE_TYPE_META, type ResourceType } from "@/lib/resources/constants";

const ENDPOINT = "/api/admin/resources";

interface UploadedFile {
  fileUrl: string;
  storageFileId: string;
  fileSize: number | null;
  thumbnailUrl: string | null;
  thumbnailStorageFileId: string | null;
}

interface Draft {
  title: string;
  description: string;
  authors: string;
  publishedAt: string;
  externalUrl: string;
  file: UploadedFile | null;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  description: "",
  authors: "",
  publishedAt: "",
  externalUrl: "",
  file: null,
};

interface ResourceManagerProps {
  type: ResourceType;
  initial: ResourceItem[];
}

/**
 * CRUD manager for one resource type. Pedagogic materials additionally accept
 * standalone HTML uploads (interactive content); every other type is PDF-only.
 */
export function ResourceManager({ type, initial }: ResourceManagerProps) {
  const meta = RESOURCE_TYPE_META[type];
  const acceptsHtml = type === "pedagogic";
  const [items, setItems] = useState<ResourceItem[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  function startEdit(item: ResourceItem) {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description,
      authors: item.authors,
      publishedAt: toDateInputValue(item.publishedAt),
      externalUrl: item.externalUrl ?? "",
      file: item.fileUrl
        ? {
            fileUrl: item.fileUrl,
            storageFileId: item.storageFileId ?? "",
            fileSize: item.fileSize,
            thumbnailUrl: item.thumbnailUrl,
            thumbnailStorageFileId: item.thumbnailStorageFileId,
          }
        : null,
    });
    setError(null);
  }

  async function handleFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadResourceFile(file);
      setDraft((prev) => ({
        ...prev,
        file: {
          fileUrl: uploaded.url,
          storageFileId: uploaded.storageFileId,
          fileSize: uploaded.size,
          thumbnailUrl: uploaded.thumbnailUrl ?? null,
          thumbnailStorageFileId: uploaded.thumbnailStorageFileId ?? null,
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o ficheiro.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const title = draft.title.trim();
    const description = draft.description.trim();
    const authors = draft.authors.trim();
    const externalUrl = draft.externalUrl.trim();
    if (!title) return setError("Adicione um título.");
    if (!draft.publishedAt) return setError("Escolha uma data.");
    if (!draft.file && !externalUrl) {
      return setError("Carregue um ficheiro ou adicione um link externo.");
    }

    // On PATCH, null clears an optional field; on POST, absent means unset.
    const payload = {
      type,
      title,
      description: description || (editingId ? null : undefined),
      authors: authors || (editingId ? null : undefined),
      publishedAt: fromDateInputValue(draft.publishedAt),
      externalUrl: externalUrl || (editingId ? null : undefined),
      fileUrl: draft.file?.fileUrl ?? (editingId ? null : undefined),
      storageFileId: draft.file?.storageFileId ?? (editingId ? null : undefined),
      fileSize: draft.file?.fileSize ?? (editingId ? null : undefined),
      thumbnailUrl: draft.file?.thumbnailUrl ?? (editingId ? null : undefined),
      thumbnailStorageFileId: draft.file?.thumbnailStorageFileId ?? (editingId ? null : undefined),
    };

    setPending(true);
    try {
      const response = await fetchWithTimeout(editingId ? `${ENDPOINT}/${editingId}` : ENDPOINT, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Não foi possível guardar.");
        return;
      }
      const { item: raw } = (await response.json()) as { item: RawResource };
      const item = normalizeResource(raw);
      setItems((prev) =>
        editingId ? prev.map((r) => (r.id === item.id ? item : r)) : [item, ...prev],
      );
      resetForm();
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function toggleVisible(item: ResourceItem) {
    setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, visible: !r.visible } : r)));
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !item.visible }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((r) => (r.id === item.id ? { ...r, visible: item.visible } : r)));
      setError("Não foi possível atualizar a visibilidade.");
    }
  }

  async function handleDelete(item: ResourceItem) {
    if (!window.confirm(`Eliminar “${item.title}”? Esta ação não pode ser anulada.`)) return;
    setBusyId(item.id);
    const index = Math.max(
      0,
      items.findIndex((r) => r.id === item.id),
    );
    setItems((prev) => prev.filter((r) => r.id !== item.id));
    if (editingId === item.id) resetForm();
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
    } catch {
      // Re-insert only the deleted row at its original position so concurrent
      // optimistic updates to other rows aren't clobbered by a stale snapshot.
      setItems((prev) =>
        prev.some((r) => r.id === item.id)
          ? prev
          : [...prev.slice(0, index), item, ...prev.slice(index)],
      );
      setError("Não foi possível eliminar o recurso.");
    } finally {
      setBusyId(null);
    }
  }

  const fileSizeLabel = draft.file ? formatFileSize(draft.file.fileSize) : null;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {editingId ? `Editar ${meta.singular}` : `Novo ${meta.singular}`}
          </h3>
          {editingId ? (
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              <X data-icon="inline-start" />
              Cancelar
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" htmlFor={`resource-title-${type}`}>
              Título
            </Label>
            <Input
              id={`resource-title-${type}`}
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Título do recurso"
              maxLength={300}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" htmlFor={`resource-date-${type}`}>
              Data
            </Label>
            <Input
              id={`resource-date-${type}`}
              type="date"
              value={draft.publishedAt}
              onChange={(e) => setDraft((prev) => ({ ...prev, publishedAt: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" htmlFor={`resource-authors-${type}`}>
              Autores (opcional)
            </Label>
            <Input
              id={`resource-authors-${type}`}
              value={draft.authors}
              onChange={(e) => setDraft((prev) => ({ ...prev, authors: e.target.value }))}
              placeholder="Nomes dos autores"
              maxLength={500}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" htmlFor={`resource-link-${type}`}>
              Link externo (opcional)
            </Label>
            <Input
              id={`resource-link-${type}`}
              type="url"
              value={draft.externalUrl}
              onChange={(e) => setDraft((prev) => ({ ...prev, externalUrl: e.target.value }))}
              placeholder="https://… (ex.: DOI, página da revista)"
              maxLength={2048}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium" htmlFor={`resource-description-${type}`}>
            Descrição (opcional)
          </Label>
          <Textarea
            id={`resource-description-${type}`}
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Um resumo curto do recurso."
            maxLength={2000}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">
            Ficheiro {acceptsHtml ? "(PDF ou HTML)" : "(PDF)"}
          </Label>
          <input
            ref={fileRef}
            type="file"
            accept={acceptsHtml ? "application/pdf,.html,.htm" : "application/pdf"}
            className="hidden"
            onChange={handleFilePicked}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <FileUp data-icon="inline-start" />
              {uploading ? "A carregar…" : draft.file ? "Substituir ficheiro" : "Carregar ficheiro"}
            </Button>
            {draft.file ? (
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="size-3.5" />
                Ficheiro carregado{fileSizeLabel ? ` (${fileSizeLabel})` : ""}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remover ficheiro"
                  onClick={() => setDraft((prev) => ({ ...prev, file: null }))}
                >
                  <X />
                </Button>
              </span>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={pending || uploading}>
          <Plus data-icon="inline-start" />
          {pending ? "A guardar…" : editingId ? "Guardar alterações" : "Adicionar recurso"}
        </Button>
      </form>

      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {meta.label} ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
            Ainda não há recursos nesta secção.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                {item.thumbnailUrl ? (
                  /* biome-ignore lint/performance/noImgElement: admin-only thumbnail */
                  <img
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-16 w-12 shrink-0 rounded-md border border-border object-cover object-top"
                  />
                ) : (
                  <span className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                    <FileText className="size-5 text-muted-foreground/60" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  {item.authors ? (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{item.authors}</p>
                  ) : null}
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                    {formatDate(item.publishedAt)}
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir ficheiro de “${item.title}”`}
                        className="inline-flex items-center gap-0.5 hover:text-foreground hover:underline"
                      >
                        <Download className="size-3" />
                        Ficheiro
                      </a>
                    ) : null}
                    {item.externalUrl ? (
                      <a
                        href={item.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir link externo de “${item.title}”`}
                        className="inline-flex items-center gap-0.5 hover:text-foreground hover:underline"
                      >
                        <ExternalLink className="size-3" />
                        Link externo
                      </a>
                    ) : null}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => toggleVisible(item)}
                    aria-label={item.visible ? "Ocultar recurso" : "Mostrar recurso"}
                  />
                  {item.visible ? "Visível" : "Oculto"}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Editar"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Eliminar"
                    className="text-destructive hover:text-destructive"
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
