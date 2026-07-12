"use client";

import { AlertCircle, ExternalLink, Pencil, Plus, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import {
  formatDate,
  fromDateInputValue,
  normalizeWebinar,
  type RawWebinar,
  toDateInputValue,
  type WebinarItem,
} from "@/components/admin/news-media/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const ENDPOINT = "/api/admin/news-media/webinars";

interface Draft {
  youtubeUrl: string;
  title: string;
  publishedAt: string;
}

const EMPTY_DRAFT: Draft = {
  youtubeUrl: "",
  title: "",
  publishedAt: "",
};

export function WebinarManager({ initial }: { initial: WebinarItem[] }) {
  const [items, setItems] = useState<WebinarItem[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setError(null);
  }

  function startEdit(item: WebinarItem) {
    setEditingId(item.id);
    setDraft({
      youtubeUrl: `https://www.youtube.com/watch?v=${item.youtubeId}`,
      title: item.title,
      publishedAt: toDateInputValue(item.publishedAt),
    });
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const youtubeUrl = draft.youtubeUrl.trim();
    const title = draft.title.trim();
    if (!youtubeUrl) return setError("Adicione o link do YouTube.");
    if (!draft.publishedAt) return setError("Escolha uma data.");
    // On create the title is optional — the server fills it from YouTube.
    if (editingId && !title) return setError("Adicione um título.");

    const payload = {
      youtubeUrl,
      ...(title ? { title } : {}),
      publishedAt: fromDateInputValue(draft.publishedAt),
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
      const { item: raw } = (await response.json()) as { item: RawWebinar };
      const item = normalizeWebinar(raw);
      setItems((prev) =>
        editingId ? prev.map((w) => (w.id === item.id ? item : w)) : [item, ...prev],
      );
      resetForm();
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  async function toggleVisible(item: WebinarItem) {
    setItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, visible: !w.visible } : w)));
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: !item.visible }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setItems((prev) => prev.map((w) => (w.id === item.id ? { ...w, visible: item.visible } : w)));
      setError("Não foi possível atualizar a visibilidade.");
    }
  }

  async function handleDelete(item: WebinarItem) {
    if (!window.confirm(`Eliminar “${item.title}”? Esta ação não pode ser anulada.`)) return;
    setBusyId(item.id);
    const index = Math.max(
      0,
      items.findIndex((w) => w.id === item.id),
    );
    setItems((prev) => prev.filter((w) => w.id !== item.id));
    if (editingId === item.id) resetForm();
    try {
      const response = await fetchWithTimeout(`${ENDPOINT}/${item.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
    } catch {
      // Re-insert only the deleted row at its original position so concurrent
      // optimistic updates to other rows aren't clobbered by a stale snapshot.
      setItems((prev) =>
        prev.some((w) => w.id === item.id)
          ? prev
          : [...prev.slice(0, index), item, ...prev.slice(index)],
      );
      setError("Não foi possível eliminar o webinar.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">
            {editingId ? "Editar webinar" : "Novo webinar"}
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
            <Label className="text-sm font-medium" htmlFor="webinar-url">
              Link do YouTube
            </Label>
            <Input
              id="webinar-url"
              type="url"
              value={draft.youtubeUrl}
              onChange={(e) => setDraft((prev) => ({ ...prev, youtubeUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=…"
              maxLength={2048}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" htmlFor="webinar-date">
              Data
            </Label>
            <Input
              id="webinar-date"
              type="date"
              value={draft.publishedAt}
              onChange={(e) => setDraft((prev) => ({ ...prev, publishedAt: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium" htmlFor="webinar-title">
            Título{editingId ? "" : " (opcional — preenchido a partir do YouTube)"}
          </Label>
          <Input
            id="webinar-title"
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Título do webinar"
            maxLength={300}
          />
        </div>

        {error ? (
          <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <Button type="submit" size="sm" disabled={pending}>
          <Plus data-icon="inline-start" />
          {pending ? "A guardar…" : editingId ? "Guardar alterações" : "Adicionar webinar"}
        </Button>
      </form>

      <section className="space-y-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Webinars ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
            Ainda não há webinars.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                {/* biome-ignore lint/performance/noImgElement: admin-only thumbnail */}
                <img
                  src={`https://i.ytimg.com/vi/${item.youtubeId}/mqdefault.jpg`}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {formatDate(item.publishedAt)}
                    <a
                      href={`https://www.youtube.com/watch?v=${item.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir “${item.title}” no YouTube`}
                      className="inline-flex items-center gap-0.5 hover:text-foreground hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Ver no YouTube
                    </a>
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch
                    checked={item.visible}
                    onCheckedChange={() => toggleVisible(item)}
                    aria-label={item.visible ? "Ocultar webinar" : "Mostrar webinar"}
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
