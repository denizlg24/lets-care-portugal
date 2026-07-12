"use client";

import { AlertCircle, Check, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { formatDate } from "@/components/admin/news-media/shared";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEGAL_PAGE_META, LEGAL_SLUGS, type LegalSlug } from "@/lib/legal/constants";
import { DEFAULT_LEGAL_PAGES } from "@/lib/legal/defaults";
import type { PublicLegalPage } from "@/lib/legal/service";
import { cn } from "@/lib/utils";

interface LegalManagerProps {
  pages: PublicLegalPage[];
}

interface Draft {
  title: string;
  content: string;
  updatedAt: string | null;
  dirty: boolean;
}

function toDrafts(pages: PublicLegalPage[]): Record<LegalSlug, Draft> {
  const drafts = {} as Record<LegalSlug, Draft>;
  for (const page of pages) {
    drafts[page.slug] = {
      title: page.title,
      content: page.content,
      updatedAt: page.updatedAt,
      dirty: false,
    };
  }
  return drafts;
}

export function LegalManager({ pages }: LegalManagerProps) {
  const [tab, setTab] = useState<LegalSlug>("privacidade");
  const [drafts, setDrafts] = useState<Record<LegalSlug, Draft>>(() => toDrafts(pages));
  const [savingSlug, setSavingSlug] = useState<LegalSlug | null>(null);
  const [savedSlug, setSavedSlug] = useState<LegalSlug | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patchDraft(slug: LegalSlug, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [slug]: { ...prev[slug], ...patch, dirty: true } }));
    setSavedSlug(null);
  }

  function resetToDefault(slug: LegalSlug) {
    const fallback = DEFAULT_LEGAL_PAGES[slug];
    if (
      !window.confirm(
        "Substituir o texto atual pelo conteúdo padrão? As alterações não guardadas perdem-se.",
      )
    ) {
      return;
    }
    patchDraft(slug, { title: fallback.title, content: fallback.content });
  }

  async function save(slug: LegalSlug) {
    const draft = drafts[slug];
    setError(null);

    const title = draft.title.trim();
    if (!title) return setError("Adicione um título.");
    if (!draft.content.trim()) return setError("O conteúdo não pode estar vazio.");

    setSavingSlug(slug);
    try {
      const response = await fetchWithTimeout(`/api/admin/legal/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: draft.content }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Não foi possível guardar.");
        return;
      }
      const { item } = (await response.json()) as { item: PublicLegalPage };
      setDrafts((prev) => ({
        ...prev,
        [slug]: {
          title: item.title,
          content: item.content,
          updatedAt: item.updatedAt,
          dirty: false,
        },
      }));
      setSavedSlug(slug);
    } catch {
      setError("Não foi possível guardar. Tente novamente.");
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="flex gap-1 overflow-x-auto border-b border-border"
        role="tablist"
        aria-label="Páginas legais"
      >
        {LEGAL_SLUGS.map((slug) => {
          const active = tab === slug;
          return (
            <button
              key={slug}
              id={`tab-${slug}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${slug}`}
              onClick={() => setTab(slug)}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {LEGAL_PAGE_META[slug].label}
              {drafts[slug].dirty ? <span className="size-1.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>

      {/* All panels stay mounted; inactive ones are hidden so each editor
          keeps its local state when switching tabs. */}
      {LEGAL_SLUGS.map((slug) => {
        const draft = drafts[slug];
        const meta = LEGAL_PAGE_META[slug];
        return (
          <div
            key={slug}
            id={`panel-${slug}`}
            role="tabpanel"
            aria-labelledby={`tab-${slug}`}
            hidden={tab !== slug}
            className="space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Publicada em{" "}
                <a
                  href={meta.path}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-secondary hover:underline"
                >
                  {meta.path}
                </a>
                {draft.updatedAt
                  ? ` · última atualização ${formatDate(draft.updatedAt)}`
                  : " · a mostrar o conteúdo padrão"}
              </p>
              <Button type="button" size="sm" variant="ghost" onClick={() => resetToDefault(slug)}>
                <RotateCcw data-icon="inline-start" />
                Repor conteúdo padrão
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium" htmlFor={`legal-title-${slug}`}>
                Título
              </Label>
              <Input
                id={`legal-title-${slug}`}
                value={draft.title}
                onChange={(e) => patchDraft(slug, { title: e.target.value })}
                maxLength={200}
              />
            </div>

            <MarkdownEditor
              value={draft.content}
              onChange={(content) => patchDraft(slug, { content })}
              placeholder="Conteúdo da página em markdown."
            />

            {error && tab === slug ? (
              <p className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                size="sm"
                disabled={savingSlug === slug || !draft.dirty}
                onClick={() => save(slug)}
              >
                <Save data-icon="inline-start" />
                {savingSlug === slug ? "A guardar…" : "Guardar alterações"}
              </Button>
              {savedSlug === slug && !draft.dirty ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="size-4 text-secondary" />
                  Guardado
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
