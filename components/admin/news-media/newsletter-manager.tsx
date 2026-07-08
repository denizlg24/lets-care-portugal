"use client";

import { AlertCircle, Download, FileText, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import {
  formatDate,
  formatFileSize,
  fromDateInputValue,
  type NewsletterItem,
  normalizeNewsletter,
  type RawNewsletter,
  toDateInputValue,
  uploadNewsMediaFile,
} from "@/components/admin/news-media/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const ENDPOINT = "/api/admin/news-media/newsletters";

interface Draft {
  title: string;
  publishedAt: string;
  fileUrl: string;
  storageFileId: string;
  fileSize: number | null;
  fileName: string;
}

const EMPTY_DRAFT: Draft = {
  title: "",
  publishedAt: "",
  fileUrl: "",
  storageFileId: "",
  fileSize: null,
  fileName: "",
};

export function NewsletterManager({ initial }: { initial: NewsletterItem[] }) {
  const [items, setItems] = useState<NewsletterItem[]>(initial);
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

  function startEdit(item: NewsletterItem) {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      publishedAt: toDateInputValue(item.publishedAt),
      fileUrl: item.fileUrl,
      storageFileId: item.storageFileId,
      fileSize: item.fileSize,
      fileName: item.title,
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
        fileUrl: uploaded.url,
        storageFileId: uploaded.storageFileId,
        fileSize: uploaded.size,
        fileName: file.name,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o PDF.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const title = draft.title.trim();
    if (!title) return setError("Adicione um título.");
    if (!draft.publishedAt) return setError("Escolha uma data de publicação.");
    if (!draft.fileUrl || !draft.storageFileId) return setError("Carregue o ficheiro PDF.");

    const payload = {
      title,
      publishedAt: fromDateInputValue(draft.publishedAt),
      fileUrl: draft.fileUrl,
      storageFileId: draft.storageFileId,
      fileSize: draft.fileSize ?? undefined,
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
      const { item: raw } = (await response.json()) as { item: RawNewsletter };
      const item = normalizeNewsletter(raw);
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

  async function toggleVisible(item: NewsletterItem) {
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

  async function handleDelete(item: NewsletterItem) {
    if (!window.confirm(`Eliminar “${item.title}”? Esta ação não pode ser anulada.`)) return;
    setBusyId(item.id);
    const index = Math.max(
      0,
      items.findIndex((n) => n.id === item.id),
    );
    setItems((prev) => prev.filter((n) => n.id !== item.id));
    if (editingId === item.id) resetForm();
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
    } catch {
      // Re-insert only the deleted row at its original position so concurrent
      // optimistic updates to other rows aren't clobbered by a stale snapshot.
      setItems((prev) =>
        prev.some((n) => n.id === item.id)
          ? prev
          : [...prev.slice(0, index), item, ...prev.slice(index)],
      );
      setError("Não foi possível eliminar o newsletter.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {editingId ? "Editar newsletter" : "Novo newsletter"}
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
            <Label className="text-sm font-medium" htmlFor="newsletter-title">
              Título
            </Label>
            <Input
              id="newsletter-title"
              value={draft.title}
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Newsletter informativo — Primavera 2026"
              maxLength={300}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" htmlFor="newsletter-date">
              Data de publicação
            </Label>
            <Input
              id="newsletter-date"
              type="date"
              value={draft.publishedAt}
              onChange={(e) => setDraft((prev) => ({ ...prev, publishedAt: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Ficheiro PDF</Label>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFilePicked}
          />
          {draft.fileUrl ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="size-4 shrink-0 text-accent" />
              <a
                href={draft.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate font-medium text-foreground hover:underline"
              >
                {draft.fileName || "Documento PDF"}
              </a>
              {formatFileSize(draft.fileSize) ? (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatFileSize(draft.fileSize)}
                </span>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload data-icon="inline-start" />
                Substituir
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload data-icon="inline-start" />
              {uploading ? "A carregar…" : "Carregar PDF"}
            </Button>
          )}
        </div>

        {error ? (
          <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={pending || uploading}>
          <Plus data-icon="inline-start" />
          {pending ? "A guardar…" : editingId ? "Guardar alterações" : "Adicionar newsletter"}
        </Button>
      </form>

      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Newsletters ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
            Ainda não há newsletters.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.publishedAt)}
                    {formatFileSize(item.fileSize) ? ` · ${formatFileSize(item.fileSize)}` : ""}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => toggleVisible(item)}
                    aria-label={item.visible ? "Ocultar newsletter" : "Mostrar newsletter"}
                  />
                  {item.visible ? "Visível" : "Oculto"}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Abrir PDF"
                  >
                    <Download className="size-4" />
                  </a>
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
