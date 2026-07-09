"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

type FaIconModule = Record<string, IconType>;

let faIconsPromise: Promise<FaIconModule> | null = null;

/**
 * Lazy-loads the full `react-icons/fa6` pack once per session. The pack is
 * large, so it stays out of the initial admin bundle and only downloads when
 * a stored icon (or the icon picker) needs it.
 */
export function loadFaIcons(): Promise<FaIconModule> {
  faIconsPromise ??= import("react-icons/fa6").then((module) => module as unknown as FaIconModule);
  return faIconsPromise;
}

interface FaIconProps {
  name: string;
  className?: string;
}

/** Renders a `react-icons/fa6` icon by export name, with a neutral placeholder
 * while the pack loads or when the name is unknown. */
export function FaIcon({ name, className }: FaIconProps) {
  const [icons, setIcons] = useState<FaIconModule | null>(null);

  useEffect(() => {
    let active = true;
    loadFaIcons().then((module) => {
      if (active) setIcons(module);
    });
    return () => {
      active = false;
    };
  }, []);

  const Icon = icons?.[name];
  if (!Icon) {
    return (
      <span className={cn("inline-block size-4 rounded-sm bg-muted", className)} aria-hidden />
    );
  }
  return <Icon className={cn("size-4", className)} aria-hidden />;
}
