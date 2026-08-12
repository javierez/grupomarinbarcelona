"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PromotionGalleryProps {
  images: { id: string; url: string; alt: string | null }[];
  promotionName: string;
}

export function PromotionGallery({ images, promotionName }: PromotionGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i + 1) % images.length,
      ),
    [images.length],
  );
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i - 1 + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, close, next, prev]);

  if (images.length === 0) return null;

  const current = openIndex !== null ? images[openIndex] : null;
  const currentAlt =
    current?.alt ??
    (openIndex !== null
      ? `${promotionName} — imagen ${openIndex + 1}`
      : "");

  return (
    <section aria-labelledby="promotion-gallery-heading" className="mb-16">
      <div className="mb-6">
        <h2
          id="promotion-gallery-heading"
          className="text-xl font-medium tracking-tight text-foreground sm:text-2xl"
        >
          Galería
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Imágenes de {promotionName}. Pulsa una imagen para ampliarla.
        </p>
      </div>

      <ul
        className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4"
        role="list"
      >
        {images.map((img, index) => {
          const alt = img.alt ?? `${promotionName} — imagen ${index + 1}`;
          return (
            <li
              key={img.id}
              className="mb-3 break-inside-avoid sm:mb-4"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-label={`Ampliar imagen: ${alt}`}
                className="group block w-full overflow-hidden rounded-xl bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Image
                  src={img.url}
                  alt={alt}
                  width={800}
                  height={1000}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {isOpen && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada: ${currentAlt}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={close}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Cerrar"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Imagen siguiente"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <figure
            className="relative flex max-h-full max-w-6xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[80vh] w-[90vw] max-w-6xl">
              <Image
                src={current.url}
                alt={currentAlt}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>
            <figcaption className="mt-3 text-center text-xs text-white/70">
              {openIndex !== null ? `${openIndex + 1} / ${images.length}` : ""}
              {current.alt ? ` — ${current.alt}` : ""}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
