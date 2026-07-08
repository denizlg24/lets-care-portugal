"use client";

import { AlertCircle, ExternalLink, ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import {
  formatDate,
  fromDateInputValue,
  type NewsItem,
  normalizeNews,
  type RawNews,
  toDateInputValue,
  uploadNewsMediaFile,
} from "@/components/admin/news-media/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const ENDPOINT = "/api/admin/news-media/news";

interface Draft {
  imageUrl: string;
  storageFileId: string;
  title: string;
  description: string;
  date: string;
  externalUrl: string;
}

const EMPTY_DRAFT: Draft = {
  imageUrl: "",
  storageFileId: "",
  title: "",
  description: "",
  date: "",
  externalUrl: "",
};

export function NewsItemManager({ initial }: { initial: NewsItem[] }) {
  const [items, setItems] = useState<NewsItem[]>(initial);
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

  function startEdit(item: NewsItem) {
    setEditingId(item.id);
    setDraft({
      imageUrl: item.imageUrl,
      storageFileId: item.storageFileId,
      title: item.title,
      description: item.description,
      date: toDateInputValue(item.date),
      externalUrl: item.externalUrl,
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
      const uploaded = await uploadNewsMediaFile(file);
      setDraft((prev) => ({
        ...prev,
        imageUrl: uploaded.url,
        storageFileId: uploaded.storageFileId,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const title = draft.title.trim();
    const description = draft.description.trim();
    const externalUrl = draft.externalUrl.trim();
    if (!draft.imageUrl || !draft.storageFileId) return setError("Carregue uma imagem.");
    if (!title) return setError("Adicione um título.");
    if (!description) return setError("Adicione uma descrição.");
    if (!draft.date) return setError("Escolha uma data.");
    if (!externalUrl) return setError("Adicione o link externo.");

    const payload = {
      imageUrl: draft.imageUrl,
      storageFileId: draft.storageFileId,
      title,
      description,
      date: fromDateInputValue(draft.date),
      externalUrl,
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
      const { item: raw } = (await response.json()) as { item: RawNews };
      const item = normalizeNews(raw);
      setItems((prev) =>
        editingId ? prev.map((n) => (n.id === item.id ? item : n)) : [item, ...prev],
      );
      resetForm();
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function toggleVisible(item: NewsItem) {
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, visible: !n.visible } : n)));
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !item.visible }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, visible: item.visible } : n)));
      setError("Não foi possível atualizar a visibilidade.");
    }
  }

  async function handleDelete(item: NewsItem) {
    if (!window.confirm(`Eliminar “${item.title}”? Esta ação não pode ser anulada.`)) return;
    setBusyId(item.id);
    const snapshot = items;
    setItems((prev) => prev.filter((n) => n.id !== item.id));
    if (editingId === item.id) resetForm();
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
    } catch {
      setItems(snapshot);
      setError("Não foi possível eliminar a notícia.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {editingId ? "Editar notícia" : "Nova notícia"}
          </h3>
          {editingId ? (
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              <X data-icon="inline-start" />
              Cancelar
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Imagem</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFilePicked}
            />
            {draft.imageUrl ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="group relative block h-28 w-40 overflow-hidden rounded-lg border border-border"
                aria-label="Substituir imagem"
              >
                {/* biome-ignore lint/performance/noImgElement: admin-only preview thumbnail */}
                <img
                  src={draft.imageUrl}
                  alt="Pré-visualização"
                  className="size-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Substituir
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex h-28 w-40 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <ImageUp className="size-5" />
                {uploading ? "A carregar…" : "Carregar"}
              </button>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" htmlFor="news-title">
                  Título
                </Label>
                <Input
                  id="news-title"
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da notícia"
                  maxLength={300}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium" htmlFor="news-date">
                  Data
                </Label>
                <Input
                  id="news-date"
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" htmlFor="news-link">
                Link externo
              </Label>
              <Input
                id="news-link"
                type="url"
                value={draft.externalUrl}
                onChange={(e) => setDraft((prev) => ({ ...prev, externalUrl: e.target.value }))}
                placeholder="https://…"
                maxLength={2048}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium" htmlFor="news-description">
            Descrição
          </Label>
          <Textarea
            id="news-description"
            value={draft.description}
            onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Um resumo curto da notícia."
            maxLength={2000}
            rows={3}
          />
        </div>

        {error ? (
          <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={pending || uploading}>
          <Plus data-icon="inline-start" />
          {pending ? "A guardar…" : editingId ? "Guardar alterações" : "Adicionar notícia"}
        </Button>
      </form>

      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Notícias ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
            Ainda não há notícias.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                {/* biome-ignore lint/performance/noImgElement: admin-only thumbnail */}
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {formatDate(item.date)}
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
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => toggleVisible(item)}
                    aria-label={item.visible ? "Ocultar notícia" : "Mostrar notícia"}
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
