"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ResolvedBanner } from "~/server/queries/banner";

interface BannerCarouselProps {
  slides: ResolvedBanner[];
  intervalMs: number;
}

/**
 * Homepage banner that rotates through one or more slides. With a single slide
 * it renders statically; with several it auto-advances every `intervalMs` and
 * shows dot indicators. Each slide links to its own CTA href (e.g. a promotion
 * page), so clicking the banner takes you to that promotion.
 */
export function BannerCarousel({ slides, intervalMs }: BannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % count),
      Math.max(2000, intervalMs),
    );
    return () => clearInterval(id);
  }, [count, intervalMs, paused]);

  const slide = slides[index];
  if (!slide) return null;

  const centered = slide.align === "center";
  const gradient = centered
    ? slide.overlay
      ? "bg-gradient-to-t from-black/85 via-black/45 to-black/20"
      : "bg-gradient-to-t from-black/60 via-black/25 to-transparent"
    : slide.overlay
      ? "bg-gradient-to-r from-black/85 via-black/55 to-black/10"
      : "bg-gradient-to-r from-black/65 via-black/30 to-transparent";

  const bare = slide.bare;

  const inner = (
    <div
      className={`group relative h-[320px] w-full overflow-hidden rounded-2xl sm:h-[400px] md:h-[460px] ${
        bare ? "" : "shadow-xl ring-1 ring-black/5"
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {slide.backgroundImage ? (
            slide.fit === "contain" ? (
              <>
                {/* Blurred, zoomed copy fills the letterbox gaps so the whole
                    image can be shown without empty bars. Skipped in "bare"
                    mode, which keeps the background transparent. */}
                {!bare && (
                  <Image
                    src={slide.backgroundImage}
                    alt=""
                    aria-hidden
                    fill
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className="scale-110 object-cover blur-2xl"
                    priority
                  />
                )}
                <Image
                  src={slide.backgroundImage}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  className="object-contain"
                  priority
                />
              </>
            ) : (
              <Image
                src={slide.backgroundImage}
                alt={slide.title}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />
            )
          ) : (
            <div className="absolute inset-0 bg-brand" />
          )}
          {slide.backgroundImage && !bare && (
            <div className={`absolute inset-0 ${gradient}`} />
          )}
        </motion.div>
      </AnimatePresence>

      <div
        className={`absolute inset-0 flex flex-col justify-center gap-5 p-8 sm:p-12 md:p-16 ${
          centered ? "items-center text-center" : "items-start text-left"
        }`}
      >
        {slide.eyebrow && (
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {slide.eyebrow}
          </span>
        )}

        <h2 className="max-w-2xl text-3xl font-bold leading-[1.1] tracking-tight text-white [text-shadow:_0_2px_12px_rgb(0_0_0_/_60%)] sm:text-4xl md:text-5xl">
          {slide.title}
        </h2>

        {slide.subtitle && (
          <p className="max-w-xl text-base font-medium text-white/90 [text-shadow:_0_1px_8px_rgb(0_0_0_/_55%)] sm:text-lg">
            {slide.subtitle}
          </p>
        )}

        {slide.ctaLabel && slide.ctaHref && (
          <span className="mt-1 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-gray-900 shadow-xl shadow-black/40 ring-1 ring-black/5 transition-all group-hover:gap-3 group-hover:bg-white group-hover:shadow-2xl sm:text-base">
            {slide.ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir a la promoción ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="pt-8 sm:pt-10 md:pt-12">
      {slide.ctaHref ? (
        <Link href={slide.ctaHref} aria-label={slide.title} className="block">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </section>
  );
}
