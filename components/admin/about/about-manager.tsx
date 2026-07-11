"use client";

import { ChevronDown, ChevronUp, ImageUp, Loader2, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { IconPicker } from "@/components/admin/contacts/icon-picker";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { MarkdownEditor } from "@/components/markdown/markdown-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface TeamLinkItem {
  icon: string;
  label: string;
  href: string;
}

export interface TeamMemberItem {
  image: string;
  name: string;
  abstract: string;
  links: TeamLinkItem[];
}

export interface AboutSectionItem {
  title: string;
  body: string;
  image: string;
  imageAlt: string;
}

export interface AboutInitial {
  sections: AboutSectionItem[];
  team: TeamMemberItem[];
}

/** Client-only stable key so cards keep their local state when reordered. */
type EditableMember = TeamMemberItem & { uid: string };
type EditableSection = AboutSectionItem & { uid: string };

function memberWithUid(member: TeamMemberItem): EditableMember {
  return { ...member, uid: crypto.randomUUID() };
}

function sectionWithUid(section: AboutSectionItem): EditableSection {
  return { ...section, uid: crypto.randomUUID() };
}

function withoutUid<T extends { uid: string }>({ uid: _uid, ...rest }: T): Omit<T, "uid"> {
  return rest;
}

// Shown before the admin types anything — the links a team member needs most.
const SUGGESTED_TEAM_ICONS = [
  "FaOrcid",
  "FaLinkedin",
  "FaEnvelope",
  "FaGoogleScholar",
  "FaResearchgate",
  "FaGlobe",
  "FaXTwitter",
  "FaGithub",
  "FaBuildingColumns",
  "FaPhone",
];

const HREF_PATTERN = /^(https?:\/\/|mailto:|tel:)/;

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetchWithTimeout("/api/admin/upload", { method: "POST", body });
  if (!response.ok) throw new Error("upload failed");
  const data = (await response.json()) as { url: string };
  return data.url;
}

function validate(sections: AboutSectionItem[], team: TeamMemberItem[]): string | null {
  if (sections.length === 0) return "Adicione pelo menos uma secção.";
  for (const [index, section] of sections.entries()) {
    const row = `Secção ${index + 1}`;
    if (!section.title.trim()) return `${row}: o título é obrigatório.`;
    if (!section.body.trim()) return `${row}: o conteúdo é obrigatório.`;
  }
  for (const [index, member] of team.entries()) {
    const row = `Equipa — membro ${index + 1}`;
    if (!member.name.trim()) return `${row}: o nome é obrigatório.`;
    for (const [linkIndex, link] of member.links.entries()) {
      const linkRow = `${row}, ligação ${linkIndex + 1}`;
      if (!link.icon.trim()) return `${linkRow}: escolha um ícone.`;
      if (!link.label.trim()) return `${linkRow}: a etiqueta é obrigatória.`;
      if (!HREF_PATTERN.test(link.href.trim())) {
        return `${linkRow}: a ligação tem de começar por https://, mailto: ou tel:`;
      }
    }
  }
  return null;
}

function toPayload(sections: AboutSectionItem[], team: TeamMemberItem[]) {
  return {
    sections: sections.map((section) => ({
      title: section.title.trim(),
      body: section.body.trim(),
      image: section.image.trim() || undefined,
      imageAlt: section.imageAlt.trim() || undefined,
    })),
    team: team.map((member) => ({
      image: member.image.trim() || undefined,
      name: member.name.trim(),
      abstract: member.abstract.trim() || undefined,
      links: member.links.map((link) => ({
        icon: link.icon.trim(),
        label: link.label.trim(),
        href: link.href.trim(),
      })),
    })),
  };
}

interface SectionCardProps {
  section: AboutSectionItem;
  index: number;
  total: number;
  onChange: (patch: Partial<AboutSectionItem>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onError: (message: string) => void;
}

function SectionCard({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onError,
}: SectionCardProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImagePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      onChange({ image: await uploadImage(file) });
    } catch {
      onError("Não foi possível carregar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Secção {index + 1}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Mover para cima"
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Mover para baixo"
          >
            <ChevronDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label="Remover secção"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePicked}
      />

      <div className="space-y-3">
        <Input
          value={section.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Título, ex.: A Nossa Missão"
          aria-label="Título da secção"
          maxLength={160}
        />

        <MarkdownEditor
          value={section.body}
          onChange={(body) => onChange({ body })}
          onImageUpload={uploadImage}
          placeholder="Conteúdo da secção. Use listas e negrito para destacar pontos-chave."
        />

        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">
            Imagem lateral (opcional)
          </span>
          <div className="flex items-start gap-3">
            {section.image ? (
              // biome-ignore lint/performance/noImgElement: admin-only preview thumbnail
              <img
                src={section.image}
                alt={section.imageAlt || "Imagem da secção"}
                className="aspect-4/3 w-40 rounded-lg border border-border bg-muted object-cover"
              />
            ) : (
              <div className="flex aspect-4/3 w-40 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
                <ImageUp className="size-5" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 data-icon="inline-start" className="animate-spin" />
                  ) : (
                    <ImageUp data-icon="inline-start" />
                  )}
                  {section.image ? "Substituir" : "Carregar"}
                </Button>
                {section.image ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onChange({ image: "", imageAlt: "" })}
                    aria-label="Remover imagem"
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
              {section.image ? (
                <Input
                  value={section.imageAlt}
                  onChange={(event) => onChange({ imageAlt: event.target.value })}
                  placeholder="Texto alternativo"
                  aria-label="Texto alternativo"
                  maxLength={160}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sem imagem, a secção ocupa a largura toda do texto.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

interface MemberPhotoProps {
  image: string;
  name: string;
  uploading: boolean;
  onPick: () => void;
  onRemove: () => void;
}

function MemberPhoto({ image, name, uploading, onPick, onRemove }: MemberPhotoProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {image ? (
        // biome-ignore lint/performance/noImgElement: admin-only preview thumbnail
        <img
          src={image}
          alt={name ? `Fotografia de ${name}` : "Fotografia do membro"}
          className="h-28 w-24 rounded-t-full bg-muted object-cover"
        />
      ) : (
        <div className="flex h-28 w-24 items-end justify-center rounded-t-full bg-muted text-muted-foreground">
          <ImageUp className="mb-3 size-5" aria-hidden />
        </div>
      )}
      <div className="flex gap-1">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={onPick}>
          {uploading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
          {image ? "Substituir" : "Carregar"}
        </Button>
        {image ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label="Remover fotografia"
          >
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

interface MemberCardProps {
  member: TeamMemberItem;
  index: number;
  total: number;
  onChange: (patch: Partial<TeamMemberItem>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onError: (message: string) => void;
}

function MemberCard({
  member,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  onError,
}: MemberCardProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImagePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      onChange({ image: await uploadImage(file) });
    } catch {
      onError("Não foi possível carregar a fotografia.");
    } finally {
      setUploading(false);
    }
  }

  function updateLink(linkIndex: number, patch: Partial<TeamLinkItem>) {
    onChange({
      links: member.links.map((link, i) => (i === linkIndex ? { ...link, ...patch } : link)),
    });
  }

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Membro {index + 1}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Mover para cima"
          >
            <ChevronUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Mover para baixo"
          >
            <ChevronDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label="Remover membro"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePicked}
      />

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <MemberPhoto
          image={member.image}
          name={member.name}
          uploading={uploading}
          onPick={() => fileInputRef.current?.click()}
          onRemove={() => onChange({ image: "" })}
        />

        <div className="min-w-0 space-y-3">
          <Input
            value={member.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder="Nome, ex.: Maria Silva"
            aria-label="Nome"
            maxLength={120}
          />
          <Textarea
            value={member.abstract}
            onChange={(event) => onChange({ abstract: event.target.value })}
            placeholder="Descrição curta, ex.: Investigadora em gerontologia social."
            aria-label="Descrição curta"
            maxLength={500}
            rows={2}
          />

          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Ligações</span>
            {member.links.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
                Sem ligações — adicione ORCID, LinkedIn ou email.
              </p>
            ) : (
              <ul className="space-y-2">
                {member.links.map((link, linkIndex) => (
                  // Rows have no stable id; order is the identity while editing.
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional editor rows
                  <li key={linkIndex} className="grid gap-2 sm:grid-cols-[8rem_1fr_1fr_auto]">
                    <IconPicker
                      value={link.icon}
                      onChange={(icon) => updateLink(linkIndex, { icon })}
                      suggested={SUGGESTED_TEAM_ICONS}
                    />
                    <Input
                      value={link.label}
                      onChange={(event) => updateLink(linkIndex, { label: event.target.value })}
                      placeholder="Etiqueta, ex.: ORCID"
                      aria-label="Etiqueta"
                    />
                    <Input
                      value={link.href}
                      onChange={(event) => updateLink(linkIndex, { href: event.target.value })}
                      placeholder="https://… | mailto:…"
                      aria-label="Ligação"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        onChange({ links: member.links.filter((_, i) => i !== linkIndex) })
                      }
                      aria-label="Remover ligação"
                      className="justify-self-end text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({ links: [...member.links, { icon: "", label: "", href: "" }] })
              }
            >
              <Plus data-icon="inline-start" />
              Adicionar ligação
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

interface AboutManagerProps {
  initial: AboutInitial;
}

export function AboutManager({ initial }: AboutManagerProps) {
  const [saved, setSaved] = useState<AboutInitial>(initial);
  const [sections, setSections] = useState<EditableSection[]>(() =>
    initial.sections.map(sectionWithUid),
  );
  const [team, setTeam] = useState<EditableMember[]>(() => initial.team.map(memberWithUid));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = useMemo(
    () =>
      JSON.stringify({ sections: sections.map(withoutUid), team: team.map(withoutUid) }) !==
      JSON.stringify(saved),
    [sections, team, saved],
  );

  function updateSection(index: number, patch: Partial<AboutSectionItem>) {
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    );
  }

  function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
    const target = index + direction;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }

  function updateMember(index: number, patch: Partial<TeamMemberItem>) {
    setTeam((prev) => prev.map((member, i) => (i === index ? { ...member, ...patch } : member)));
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);

    const plainSections = sections.map(withoutUid);
    const plainTeam = team.map(withoutUid);

    const validationError = validate(plainSections, plainTeam);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithTimeout("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(plainSections, plainTeam)),
      });
      if (!response.ok) {
        setError("Não foi possível guardar as alterações.");
        return;
      }
      setSaved({ sections: plainSections, team: plainTeam });
      setSuccess(true);
    } catch {
      setError("Não foi possível guardar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Este conteúdo aparece na página pública «Sobre Nós». As alterações ficam visíveis assim que
        guardar.
      </p>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Secções</h3>
        <p className="text-xs text-muted-foreground">
          Cada secção aparece na página pública pela ordem abaixo e entra na barra de navegação
          lateral. O conteúdo aceita Markdown (negrito, listas, ligações).
        </p>
        {sections.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Ainda não há secções — adicione a primeira.
          </p>
        ) : (
          <ul className="space-y-3">
            {sections.map((section, index) => (
              <SectionCard
                key={section.uid}
                section={section}
                index={index}
                total={sections.length}
                onChange={(patch) => updateSection(index, patch)}
                onRemove={() => setSections((prev) => prev.filter((_, i) => i !== index))}
                onMove={(direction) => setSections((prev) => moveItem(prev, index, direction))}
                onError={(message) => setError(message)}
              />
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setSections((prev) => [
              ...prev,
              sectionWithUid({ title: "", body: "", image: "", imageAlt: "" }),
            ])
          }
        >
          <Plus data-icon="inline-start" />
          Adicionar secção
        </Button>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Equipa</h3>
        {team.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Ainda não há membros da equipa — adicione o primeiro.
          </p>
        ) : (
          <ul className="space-y-3">
            {team.map((member, index) => (
              <MemberCard
                key={member.uid}
                member={member}
                index={index}
                total={team.length}
                onChange={(patch) => updateMember(index, patch)}
                onRemove={() => setTeam((prev) => prev.filter((_, i) => i !== index))}
                onMove={(direction) => setTeam((prev) => moveItem(prev, index, direction))}
                onError={(message) => setError(message)}
              />
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setTeam((prev) => [
              ...prev,
              memberWithUid({ image: "", name: "", abstract: "", links: [] }),
            ])
          }
        >
          <Plus data-icon="inline-start" />
          Adicionar membro
        </Button>
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
