"use client";

import Image from "@tiptap/extension-image";
import { NodeViewWrapper, type ReactNodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";

import { cn } from "@/lib/utils";

type ImageAttrs = {
  src?: string | null;
  alt?: string | null;
  title?: string | null;
};

function attrToString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function CaptionedImageView({ node, selected, updateAttributes }: ReactNodeViewProps) {
  const attrs = node.attrs as ImageAttrs;
  const src = attrToString(attrs.src);
  const alt = attrToString(attrs.alt);
  const title = attrToString(attrs.title);
  const caption = title || alt;

  const updateCaption = (event: ChangeEvent<HTMLInputElement>) => {
    const nextCaption = event.target.value;
    updateAttributes({
      alt: nextCaption || null,
      title: nextCaption || null,
    });
  };

  const stopEditorHandling = (
    event: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLInputElement>,
  ) => {
    event.stopPropagation();
  };

  return (
    <NodeViewWrapper
      as="figure"
      contentEditable={false}
      className={cn(
        "my-8 rounded-lg transition-shadow",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      {/* biome-ignore lint/performance/noImgElement: editor content images are arbitrary remote URLs. */}
      <img
        src={src}
        alt={alt}
        title={title || undefined}
        draggable={false}
        className="block h-auto w-full rounded-lg"
      />
      <input
        type="text"
        aria-label="Legenda da imagem"
        value={caption}
        onChange={updateCaption}
        onKeyDown={stopEditorHandling}
        onMouseDown={stopEditorHandling}
        placeholder="Adicionar legenda"
        className="mt-3 block w-full border-0 bg-transparent px-2 text-center text-sm text-muted-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:text-foreground"
      />
    </NodeViewWrapper>
  );
}

export const CaptionedImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CaptionedImageView);
  },
});
