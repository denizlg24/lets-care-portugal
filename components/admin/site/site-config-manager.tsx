"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface SiteConfigInitial {
  name: string;
  shortName: string;
  title: string;
  description: string;
  consortiumText: string;
  consortiumHref: string;
  projectLine: string;
  fundingDisclaimer: string;
}

const HREF_PATTERN = /^https?:\/\//;

function validate(config: SiteConfigInitial): string | null {
  if (!config.name.trim()) return "O nome do site é obrigatório.";
  if (!config.shortName.trim()) return "O nome curto é obrigatório.";
  if (!config.title.trim()) return "O título é obrigatório.";
  if (!config.description.trim()) return "A descrição é obrigatória.";
  if (config.consortiumHref.trim() && !HREF_PATTERN.test(config.consortiumHref.trim())) {
    return "A ligação do consórcio tem de começar por https://";
  }
  return null;
}

interface SiteConfigManagerProps {
  initial: SiteConfigInitial;
}

export function SiteConfigManager({ initial }: SiteConfigManagerProps) {
  const [saved, setSaved] = useState<SiteConfigInitial>(initial);
  const [config, setConfig] = useState<SiteConfigInitial>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(saved), [config, saved]);

  function update(patch: Partial<SiteConfigInitial>) {
    setConfig((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);

    const validationError = validate(config);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithTimeout("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name.trim(),
          shortName: config.shortName.trim(),
          title: config.title.trim(),
          description: config.description.trim(),
          consortiumText: config.consortiumText.trim(),
          consortiumHref: config.consortiumHref.trim(),
          projectLine: config.projectLine.trim(),
          fundingDisclaimer: config.fundingDisclaimer.trim(),
        }),
      });
      if (!response.ok) {
        setError("Não foi possível guardar as alterações.");
        return;
      }
      setSaved(config);
      setSuccess(true);
    } catch {
      setError("Não foi possível guardar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Identidade e metadados</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Usados no título das páginas, na partilha em redes sociais e nos motores de busca.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-name">Nome do site</Label>
          <Input
            id="site-name"
            value={config.name}
            onChange={(event) => update({ name: event.target.value })}
            maxLength={120}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-short-name">Nome curto</Label>
          <Input
            id="site-short-name"
            value={config.shortName}
            onChange={(event) => update({ shortName: event.target.value })}
            maxLength={60}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-title">Título (metadados)</Label>
          <Input
            id="site-title"
            value={config.title}
            onChange={(event) => update({ title: event.target.value })}
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-description">Descrição</Label>
          <Textarea
            id="site-description"
            value={config.description}
            onChange={(event) => update({ description: event.target.value })}
            maxLength={1000}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Também aparece na primeira coluna do rodapé.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Rodapé</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Campos opcionais — se ficarem vazios, o elemento correspondente não aparece no rodapé.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-consortium-text">Texto do consórcio</Label>
          <Input
            id="site-consortium-text"
            value={config.consortiumText}
            onChange={(event) => update({ consortiumText: event.target.value })}
            maxLength={500}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-consortium-href">Ligação do consórcio</Label>
          <Input
            id="site-consortium-href"
            value={config.consortiumHref}
            onChange={(event) => update({ consortiumHref: event.target.value })}
            placeholder="https://…"
            maxLength={500}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-project-line">Linha do projeto</Label>
          <Input
            id="site-project-line"
            value={config.projectLine}
            onChange={(event) => update({ projectLine: event.target.value })}
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-funding-disclaimer">Aviso de financiamento</Label>
          <Textarea
            id="site-funding-disclaimer"
            value={config.fundingDisclaimer}
            onChange={(event) => update({ fundingDisclaimer: event.target.value })}
            maxLength={2000}
            rows={5}
          />
        </div>
      </section>

      {error ? (
        <p className="border-l-2 border-destructive pl-3 text-sm leading-6 text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
          Guardar alterações
        </Button>
        {success && !dirty ? (
          <span className="text-sm text-muted-foreground">Alterações guardadas.</span>
        ) : null}
      </div>
    </div>
  );
}
