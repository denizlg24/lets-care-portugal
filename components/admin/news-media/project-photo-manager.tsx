"use client";

import { AlertCircle, ImageUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import {
  formatDate,
  fromDateInputValue,
  normalizePhoto,
  type PhotoItem,
  type RawPhoto,
  toDateInputValue,
  uploadNewsMediaFile,
} from "@/components/admin/news-media/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const ENDPOINT = "/api/admin/news-media/photos";

interface Draft {
  imageUrl: string;
  storageFileId: string;
  subtitle: string;
  takenAt: string;
}

const EMPTY_DRAFT: Draft = { imageUrl: "", storageFileId: "", subtitle: "", takenAt: "" };

export function ProjectPhotoManager({ initial }: { initial: PhotoItem[] }) {
  const [items, setItems] = useState<PhotoItem[]>(initial);
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

  function startEdit(item: PhotoItem) {
    setEditingId(item.id);
    setDraft({
      imageUrl: item.imageUrl,
      storageFileId: item.storageFileId,
      subtitle: item.subtitle,
      takenAt: toDateInputValue(item.takenAt),
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
    if (!draft.imageUrl || !draft.storageFileId) return setError("Carregue uma imagem.");

    const subtitle = draft.subtitle.trim();
    const payload = editingId
      ? {
          imageUrl: draft.imageUrl,
          storageFileId: draft.storageFileId,
          // Send null to clear an optional field that was emptied.
          subtitle: subtitle || null,
          takenAt: fromDateInputValue(draft.takenAt),
        }
      : {
          imageUrl: draft.imageUrl,
          storageFileId: draft.storageFileId,
          ...(subtitle ? { subtitle } : {}),
          ...(draft.takenAt ? { takenAt: fromDateInputValue(draft.takenAt) } : {}),
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
      const { item: raw } = (await response.json()) as { item: RawPhoto };
      const item = normalizePhoto(raw);
      setItems((prev) =>
        editingId ? prev.map((p) => (p.id === item.id ? item : p)) : [item, ...prev],
      );
      resetForm();
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function toggleVisible(item: PhotoItem) {
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, visible: !p.visible } : p)));
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !item.visible }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, visible: item.visible } : p)));
      setError("Não foi possível atualizar a visibilidade.");
    }
  }

  async function handleDelete(item: PhotoItem) {
    if (!window.confirm("Eliminar esta fotografia? Esta ação não pode ser anulada.")) return;
    setBusyId(item.id);
    const index = Math.max(
      0,
      items.findIndex((p) => p.id === item.id),
    );
    setItems((prev) => prev.filter((p) => p.id !== item.id));
    if (editingId === item.id) resetForm();
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
    } catch {
      // Re-insert only the deleted row at its original position so concurrent
      // optimistic updates to other rows aren't clobbered by a stale snapshot.
      setItems((prev) =>
        prev.some((p) => p.id === item.id)
          ? prev
          : [...prev.slice(0, index), item, ...prev.slice(index)],
      );
      setError("Não foi possível eliminar a fotografia.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {editingId ? "Editar fotografia" : "Nova fotografia"}
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
                className="group relative block size-32 overflow-hidden rounded-lg border border-border"
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
                className="flex size-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                <ImageUp className="size-5" />
                {uploading ? "A carregar…" : "Carregar"}
              </button>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" htmlFor="photo-subtitle">
                Legenda <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="photo-subtitle"
                value={draft.subtitle}
                onChange={(e) => setDraft((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Ex.: Visita à comunidade local"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" htmlFor="photo-date">
                Data <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Input
                id="photo-date"
                type="date"
                value={draft.takenAt}
                onChange={(e) => setDraft((prev) => ({ ...prev, takenAt: e.target.value }))}
                className="w-fit"
              />
            </div>
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
          {pending ? "A guardar…" : editingId ? "Guardar alterações" : "Adicionar fotografia"}
        </Button>
      </form>

      <section className="space-y-3">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Fotografias ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
            Ainda não há fotografias.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.id} className="space-y-2">
                <div className="relative overflow-hidden rounded-lg border border-border">
                  {/* biome-ignore lint/performance/noImgElement: admin-only thumbnail */}
                  <img
                    src={item.imageUrl}
                    alt={item.subtitle || "Fotografia de projeto"}
                    className="aspect-square w-full object-cover"
                  />
                  {!item.visible ? (
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-white">
                      Oculto
                    </span>
                  ) : null}
                </div>
                <div className="min-h-4 space-y-0.5">
                  {item.subtitle ? (
                    <p className="truncate text-xs font-medium text-foreground">{item.subtitle}</p>
                  ) : null}
                  {item.takenAt ? (
                    <p className="text-xs text-muted-foreground">{formatDate(item.takenAt)}</p>
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => toggleVisible(item)}
                    aria-label={item.visible ? "Ocultar fotografia" : "Mostrar fotografia"}
                    size="sm"
                  />
                  <div className="flex items-center gap-0.5">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
