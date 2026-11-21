"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ReformaBeforeAfter } from "~/lib/account-overrides/141-reformas";

/**
 * Draggable "antes / después" comparison slider — the motif Grupo Marín uses
 * across its magazine, but interactive. The "después" shot is the base layer
 * and the "antes" shot is clipped to the left of the handle.
 *
 * Both shots are cropped to the same box so pairs with different source aspect
 * ratios still line up. Drag/click/keyboard all come from an invisible
 * `<input type="range">` laid over the frame, which keeps it accessible
 * without hand-rolling slider semantics.
 */
export function BeforeAfterSlider({
  pair,
  className,
  priority = false,
}: {
  pair: ReformaBeforeAfter;
  className?: string;
  priority?: boolean;
}) {
  const [pos, setPos] = useState(50);

  return (
    <div
      className={cn(
        "group relative aspect-[4/3] select-none overflow-hidden rounded-lg bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className,
      )}
    >
      {/* Base layer: después */}
      <Image
        src={pair.despues}
        alt={`${pair.label} después de la reforma`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 700px"
        priority={priority}
        unoptimized
      />

      {/* Clipped layer: antes */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image
          src={pair.antes}
          alt={`${pair.label} antes de la reforma`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 700px"
          priority={priority}
          unoptimized
        />
      </div>

      {/* Corner labels — fade the one being covered up */}
      <span
        className={cn(
          "pointer-events-none absolute bottom-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-muted-foreground backdrop-blur transition-opacity",
          pos < 18 && "opacity-0",
        )}
      >
        Antes
      </span>
      <span
        className={cn(
          "pointer-events-none absolute bottom-3 right-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-brand-foreground backdrop-blur transition-opacity",
          pos > 82 && "opacity-0",
        )}
      >
        Después
      </span>

      {/* Handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-transform group-hover:scale-105">
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          <ChevronRight className="h-3.5 w-3.5 -ml-0.5" aria-hidden />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Comparar ${pair.label} antes y después de la reforma`}
        className="absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0 focus:outline-none"
      />
    </div>
  );
}

/**
 * One or more comparison sliders. With several pairs the labels become tabs so
 * each comparison gets the full width instead of being shrunk into a grid.
 */
export function BeforeAfterGallery({
  pairs,
  className,
}: {
  pairs: readonly ReformaBeforeAfter[];
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = pairs[activeIndex] ?? pairs[0];
  if (!active) return null;

  return (
    <div className={className}>
      {pairs.length > 1 && (
        <div
          role="tablist"
          aria-label="Estancias"
          className="mb-4 flex flex-wrap gap-2"
        >
          {pairs.map((pair, i) => (
            <button
              key={pair.label}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-eyebrow transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                i === activeIndex
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {pair.label}
            </button>
          ))}
        </div>
      )}

      <BeforeAfterSlider key={active.label} pair={active} />

      <p className="mt-3 text-xs text-muted-foreground">
        Arrastra para comparar el antes y el después.
      </p>
    </div>
  );
}
