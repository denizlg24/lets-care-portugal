"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import { FaIcon, loadFaIcons } from "@/components/icons/fa-icon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Shown before the admin types anything — the icons a contact page needs most.
const SUGGESTED_ICONS = [
  "FaEnvelope",
  "FaPhone",
  "FaLocationDot",
  "FaGlobe",
  "FaClock",
  "FaFacebook",
  "FaInstagram",
  "FaLinkedin",
  "FaXTwitter",
  "FaYoutube",
  "FaWhatsapp",
  "FaBluesky",
  "FaMastodon",
  "FaTiktok",
  "FaThreads",
  "FaTelegram",
];

const MAX_RESULTS = 96;

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
  /** Icons shown before the admin types anything; defaults to contact-page suggestions. */
  suggested?: string[];
}

export function IconPicker({ value, onChange, suggested = SUGGESTED_ICONS }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [icons, setIcons] = useState<Record<string, IconType> | null>(null);

  useEffect(() => {
    if (!open || icons) return;
    let active = true;
    loadFaIcons().then((module) => {
      if (active) setIcons(module);
    });
    return () => {
      active = false;
    };
  }, [open, icons]);

  const names = useMemo(() => (icons ? Object.keys(icons) : []), [icons]);

  const results = useMemo(() => {
    if (!icons) return [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return suggested.filter((name) => name in icons);
    }
    return names.filter((name) => name.toLowerCase().includes(trimmed)).slice(0, MAX_RESULTS);
  }, [icons, names, query, suggested]);

  function select(name: string) {
    onChange(name);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start font-normal"
        aria-label={value ? `Ícone: ${value}` : "Escolher ícone"}
      >
        <FaIcon name={value} className="size-4 shrink-0" />
        <span className="truncate text-xs text-muted-foreground">{value || "Escolher ícone"}</span>
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Escolher ícone</DialogTitle>
          <DialogDescription>
            Pesquise entre todos os ícones Font Awesome 6 (marcas e símbolos).
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Pesquisar, ex.: facebook, envelope, phone…"
          aria-label="Pesquisar ícones"
        />
        {!icons ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />A carregar ícones…
          </div>
        ) : results.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum ícone corresponde a “{query.trim()}”.
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            <div className="grid grid-cols-8 gap-1">
              {results.map((name) => {
                const Icon = icons[name];
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => select(name)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md border transition-colors",
                      name === value
                        ? "border-ring bg-muted text-foreground"
                        : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4.5" aria-hidden />
                    <span className="sr-only">{name}</span>
                  </button>
                );
              })}
            </div>
            {query.trim() && results.length === MAX_RESULTS ? (
              <p className="pt-2 text-center text-xs text-muted-foreground">
                A mostrar os primeiros {MAX_RESULTS} resultados — refine a pesquisa.
              </p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
