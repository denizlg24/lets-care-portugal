"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { IconPicker } from "@/components/admin/contacts/icon-picker";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface LinkItem {
  icon: string;
  label: string;
  value: string;
  href: string;
}

export interface SiteLinksInitial {
  socialLinks: LinkItem[];
  contactLinks: LinkItem[];
}

const HREF_PATTERN = /^(https?:\/\/|mailto:|tel:)/;

function validate(links: LinkItem[], section: string): string | null {
  for (const [index, link] of links.entries()) {
    const row = `${section} — linha ${index + 1}`;
    if (!link.icon.trim()) return `${row}: escolha um ícone.`;
    if (!link.label.trim()) return `${row}: a etiqueta é obrigatória.`;
    if (!HREF_PATTERN.test(link.href.trim())) {
      return `${row}: a ligação tem de começar por https://, mailto: ou tel:`;
    }
  }
  return null;
}

function toPayload(links: LinkItem[]) {
  return links.map((link) => ({
    icon: link.icon.trim(),
    label: link.label.trim(),
    value: link.value.trim() || undefined,
    href: link.href.trim(),
  }));
}

interface LinkRowsProps {
  links: LinkItem[];
  onChange: (links: LinkItem[]) => void;
  withValue: boolean;
  addLabel: string;
  emptyText: string;
}

function LinkRows({ links, onChange, withValue, addLabel, emptyText }: LinkRowsProps) {
  function update(index: number, patch: Partial<LinkItem>) {
    onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  }

  function remove(index: number) {
    onChange(links.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...links, { icon: "", label: "", value: "", href: "" }]);
  }

  return (
    <div className="space-y-3">
      {links.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-2">
          {links.map((link, index) => (
            // Rows have no stable id; order is the identity while editing.
            // biome-ignore lint/suspicious/noArrayIndexKey: positional editor rows
            <li key={index} className="rounded-lg border border-border p-3">
              <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto]">
                <IconPicker value={link.icon} onChange={(icon) => update(index, { icon })} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={link.label}
                    onChange={(event) => update(index, { label: event.target.value })}
                    placeholder="Etiqueta, ex.: Facebook"
                    aria-label="Etiqueta"
                  />
                  {withValue ? (
                    <Input
                      value={link.value}
                      onChange={(event) => update(index, { value: event.target.value })}
                      placeholder="Texto visível, ex.: geral@letscare.pt"
                      aria-label="Texto visível"
                    />
                  ) : null}
                  <Input
                    value={link.href}
                    onChange={(event) => update(index, { href: event.target.value })}
                    placeholder="https://… | mailto:… | tel:…"
                    aria-label="Ligação"
                    className={withValue ? "sm:col-span-2" : ""}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  aria-label="Remover ligação"
                  className="justify-self-end text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus data-icon="inline-start" />
        {addLabel}
      </Button>
    </div>
  );
}

interface LinksSettingsManagerProps {
  initial: SiteLinksInitial;
}

export function LinksSettingsManager({ initial }: LinksSettingsManagerProps) {
  const [saved, setSaved] = useState<SiteLinksInitial>(initial);
  const [socialLinks, setSocialLinks] = useState<LinkItem[]>(initial.socialLinks);
  const [contactLinks, setContactLinks] = useState<LinkItem[]>(initial.contactLinks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify({ socialLinks, contactLinks }) !== JSON.stringify(saved),
    [socialLinks, contactLinks, saved],
  );

  async function handleSave() {
    setError(null);
    setSuccess(false);

    const validationError =
      validate(contactLinks, "Contactos") ?? validate(socialLinks, "Redes sociais");
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithTimeout("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialLinks: toPayload(socialLinks),
          contactLinks: toPayload(contactLinks),
        }),
      });
      if (!response.ok) {
        setError("Não foi possível guardar as ligações.");
        return;
      }
      setSaved({ socialLinks, contactLinks });
      setSuccess(true);
    } catch {
      setError("Não foi possível guardar as ligações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Estas ligações aparecem na coluna de informações da página pública de contactos. As
        alterações ficam visíveis assim que guardar.
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Contactos</h3>
        <LinkRows
          links={contactLinks}
          onChange={(links) => setContactLinks(links)}
          withValue
          addLabel="Adicionar contacto"
          emptyText="Ainda não há contactos configurados — adicione email, telefone ou morada."
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Redes sociais</h3>
        <LinkRows
          links={socialLinks}
          onChange={(links) => setSocialLinks(links)}
          withValue={false}
          addLabel="Adicionar rede social"
          emptyText="Ainda não há redes sociais configuradas."
        />
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
          <span className="text-sm text-muted-foreground">Ligações guardadas.</span>
        ) : null}
      </div>
    </div>
  );
}
