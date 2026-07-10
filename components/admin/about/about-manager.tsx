"use client";

import { ChevronDown, ChevronUp, ImageUp, Loader2, Plus, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { IconPicker } from "@/components/admin/contacts/icon-picker";
import { fetchWithTimeout } from "@/components/admin/fetch-with-timeout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_MISSION_IMAGES } from "@/lib/about/defaults";

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

/** One collage slot; empty `image` keeps the bundled default. */
export interface MissionImageItem {
  image: string;
  alt: string;
}

export interface AboutInitial {
  mission: string;
  missionImages: MissionImageItem[];
  team: TeamMemberItem[];
}

/** Client-only stable key so cards keep their local state when reordered. */
type EditableMember = TeamMemberItem & { uid: string };

function withUid(member: TeamMemberItem): EditableMember {
  return { ...member, uid: crypto.randomUUID() };
}

function withoutUid({ uid: _uid, ...member }: EditableMember): TeamMemberItem {
  return member;
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

function validate(team: TeamMemberItem[]): string | null {
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

function toPayload(mission: string, missionImages: MissionImageItem[], team: TeamMemberItem[]) {
  return {
    mission: mission.trim(),
    missionImages: missionImages.map((slot) => ({
      image: slot.image.trim(),
      alt: slot.alt.trim() || undefined,
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

interface MissionImageSlotProps {
  slot: MissionImageItem;
  index: number;
  onChange: (patch: Partial<MissionImageItem>) => void;
  onError: (message: string) => void;
}

function MissionImageSlot({ slot, index, onChange, onError }: MissionImageSlotProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fallback = DEFAULT_MISSION_IMAGES[index];
  const custom = Boolean(slot.image);

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
    <li className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePicked}
      />
      <div className="relative">
        {/* biome-ignore lint/performance/noImgElement: admin-only preview thumbnail */}
        <img
          src={slot.image || fallback.src}
          alt={slot.alt || fallback.alt}
          className="aspect-4/3 w-full rounded-lg border border-border bg-muted object-cover"
        />
        {!custom ? (
          <span className="absolute bottom-1.5 left-1.5 rounded bg-background/85 px-1.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Predefinida
          </span>
        ) : null}
      </div>
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
          {custom ? "Substituir" : "Carregar"}
        </Button>
        {custom ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onChange({ image: "", alt: "" })}
            aria-label="Repor imagem predefinida"
            title="Repor imagem predefinida"
          >
            <X />
          </Button>
        ) : null}
      </div>
      {custom ? (
        <Input
          value={slot.alt}
          onChange={(event) => onChange({ alt: event.target.value })}
          placeholder="Texto alternativo"
          aria-label="Texto alternativo"
          maxLength={160}
        />
      ) : null}
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
  const [mission, setMission] = useState(initial.mission);
  const [missionImages, setMissionImages] = useState<MissionImageItem[]>(initial.missionImages);
  const [team, setTeam] = useState<EditableMember[]>(() => initial.team.map(withUid));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dirty = useMemo(
    () =>
      JSON.stringify({ mission, missionImages, team: team.map(withoutUid) }) !==
      JSON.stringify(saved),
    [mission, missionImages, team, saved],
  );

  function updateMissionImage(index: number, patch: Partial<MissionImageItem>) {
    setMissionImages((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function updateMember(index: number, patch: Partial<TeamMemberItem>) {
    setTeam((prev) => prev.map((member, i) => (i === index ? { ...member, ...patch } : member)));
  }

  function moveMember(index: number, direction: -1 | 1) {
    setTeam((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);

    const validationError = validate(team);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithTimeout("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(mission, missionImages, team)),
      });
      if (!response.ok) {
        setError("Não foi possível guardar as alterações.");
        return;
      }
      setSaved({ mission, missionImages, team: team.map(withoutUid) });
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

      <section className="space-y-2">
        <Label className="text-sm font-semibold text-foreground" htmlFor="mission">
          Missão
        </Label>
        <Textarea
          id="mission"
          value={mission}
          onChange={(event) => setMission(event.target.value)}
          placeholder="Descreva a missão do projeto. Separe parágrafos com uma linha em branco."
          maxLength={5000}
          rows={7}
        />
        <p className="text-xs text-muted-foreground">
          Se ficar vazio, a página mostra um texto de exemplo.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Imagens da missão</h3>
        <p className="text-xs text-muted-foreground">
          As quatro imagens da grelha ao lado do texto da missão. Sem imagem carregada, é usada a
          predefinida.
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {missionImages.map((slot, index) => (
            <MissionImageSlot
              key={DEFAULT_MISSION_IMAGES[index].src}
              slot={slot}
              index={index}
              onChange={(patch) => updateMissionImage(index, patch)}
              onError={(message) => setError(message)}
            />
          ))}
        </ul>
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
                onMove={(direction) => moveMember(index, direction)}
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
            setTeam((prev) => [...prev, withUid({ image: "", name: "", abstract: "", links: [] })])
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
