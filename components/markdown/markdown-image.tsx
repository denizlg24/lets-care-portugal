"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type MarkdownImageProps = {
  src?: string;
  alt?: string;
  title?: string;
};

/**
 * Renders a markdown image with a skeleton placeholder while it loads, so the
 * page never shifts as remote images arrive. The wrapper reserves space via an
 * aspect ratio (default 16:10) until the real dimensions are known, then relaxes
 * to `height:auto` once loaded. If the source fails, we show a quiet caption
 * instead of a broken-image icon.
 */
export function MarkdownImage({ src, alt, title }: MarkdownImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");

  if (!src || status === "error") {
    return (
      <span className="my-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        <span className="flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-muted">
          {alt || "Imagem indisponível"}
        </span>
      </span>
    );
  }

  return (
    // Spans (block-styled) rather than <figure>, because react-markdown wraps
    // images in a <p> and block elements there produce invalid nesting.
    <span className="my-8 block">
      <span
        className={cn(
          "relative block w-full overflow-hidden rounded-lg",
          status === "loading" && "aspect-[16/10] animate-pulse bg-muted",
        )}
      >
        {/* biome-ignore lint: content images come from arbitrary URLs with unknown intrinsic size; next/image's static optimizer does not apply and the wrapper reserves space to avoid layout shift. */}
        <img
          src={src}
          alt={alt ?? ""}
          title={title}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "block h-auto w-full transition-opacity duration-500",
            status === "loaded" ? "opacity-100" : "absolute inset-0 opacity-0",
          )}
        />
      </span>
      {alt ? (
        <span className="mt-3 block text-center text-sm text-muted-foreground">{alt}</span>
      ) : null}
    </span>
  );
}
