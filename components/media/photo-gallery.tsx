"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface PhotoGalleryProps {
  images: GalleryImage[];
}

/**
 * Responsive photo grid with a full-screen lightbox. Clicking a photo opens it
 * enlarged; arrow keys and on-screen buttons move between photos.
 */
export function PhotoGallery({ images }: PhotoGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);

  const showPrevious = useCallback(() => {
    setIndex((current) =>
      current === null ? current : (current - 1 + images.length) % images.length,
    );
  }, [images.length]);

  const showNext = useCallback(() => {
    setIndex((current) => (current === null ? current : (current + 1) % images.length));
  }, [images.length]);

  useEffect(() => {
    if (index === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, showPrevious, showNext]);

  const current = index === null ? null : images[index];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {images.map((image, i) => (
          <li key={image.src}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block aspect-square w-full overflow-hidden rounded-lg bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="sr-only">Ampliar fotografia</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={current !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-black/95 p-0 text-white ring-0 sm:max-w-none"
        >
          {current && (
            <>
              <DialogTitle className="sr-only">
                {current.caption || "Fotografia ampliada"}
              </DialogTitle>

              <div className="relative min-h-0 flex-1">
                <Image
                  src={current.src}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>

              <div className="flex min-h-14 items-center justify-center px-16 py-3 text-center text-sm text-white/80">
                {current.caption}
                {images.length > 1 && (
                  <span className="ml-2 text-white/50">
                    {(index ?? 0) + 1} / {images.length}
                  </span>
                )}
              </div>

              <DialogClose className="absolute top-3 right-3 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20">
                <X className="size-5" aria-hidden />
                <span className="sr-only">Fechar</span>
              </DialogClose>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrevious}
                    className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                  >
                    <ChevronLeft className="size-6" aria-hidden />
                    <span className="sr-only">Fotografia anterior</span>
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                  >
                    <ChevronRight className="size-6" aria-hidden />
                    <span className="sr-only">Fotografia seguinte</span>
                  </button>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
