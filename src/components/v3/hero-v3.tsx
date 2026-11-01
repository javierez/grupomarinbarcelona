"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroMediaItem } from "~/lib/hero-media";
import { cn } from "~/lib/utils";

export interface HeroV3Slide {
  title: string;
  subtitle?: string;
  buttonText?: string;
  href: string;
  media: HeroMediaItem | null;
}

interface HeroV3Props {
  slides: HeroV3Slide[];
  /** Still frame for video slides while they load. */
  poster?: string;
  overlayOpacity: number;
}

const AUTOPLAY_MS = 7000;
// The spaced capitals only work for one short word ("Inmuebles"); a whole
// sentence at that size and tracking would run off the screen.
const SHORT_TITLE = 12;

/**
 * `features_props.heroStyle: "v3"`: full-screen slideshow. Each slide shows
 * one big letter-spaced word, a subtitle, an outlined button and square
 * arrows, over its own photo or video, cross-fading every 7 seconds.
 */
export function HeroV3({ slides, poster, overlayOpacity }: HeroV3Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  const go = useCallback(
    (step: number) => setCurrent((i) => (i + step + count) % count),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, go, current]);

  const slide = slides[current] ?? slides[0];
  if (!slide) return null;
  const short = slide.title.length <= SHORT_TITLE;

  return (
    <section
      className="relative -mt-20 h-[100svh] min-h-[600px] overflow-hidden text-white sm:-mt-24"
      aria-roledescription="carrusel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={i}
          aria-hidden={i !== current}
          className={cn(
            "absolute inset-0 transition-opacity duration-[1200ms] ease-in-out",
            i === current ? "opacity-100" : "opacity-0",
          )}
        >
          {s.media?.type === "video" ? (
            <video
              src={s.media.url}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : s.media ? (
            <Image
              src={s.media.url}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                "object-cover transition-transform duration-[7000ms] ease-out",
                i === current ? "scale-100" : "scale-[1.06]",
              )}
            />
          ) : (
            <div className="h-full w-full bg-neutral-700" />
          )}
        </div>
      ))}
      <div
        className="absolute inset-0 bg-[rgb(40,32,20)]"
        style={{ opacity: overlayOpacity }}
      />

      <div className="absolute inset-x-6 top-[30%] z-10 sm:inset-x-12 lg:left-[21%] lg:right-auto lg:max-w-3xl">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1
            className={cn(
              "font-normal uppercase leading-none",
              short
                ? "text-[clamp(40px,6vw,85px)] tracking-[0.24em]"
                : "text-[clamp(32px,4.5vw,64px)] tracking-[0.06em]",
            )}
          >
            {slide.title}
          </h1>
          {slide.subtitle && (
            <p className="mt-8 max-w-sm text-[clamp(20px,2.2vw,32px)] font-normal leading-tight sm:mt-11">
              {slide.subtitle}
            </p>
          )}
        </motion.div>

        <div className="mt-8 flex gap-2">
          <Link
            href={slide.href}
            className="flex h-[60px] w-[min(364px,56vw)] items-center justify-center border border-white text-sm font-light transition-colors hover:bg-white hover:text-foreground"
          >
            {slide.buttonText || "Saber más"}
          </Link>
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Diapositiva anterior"
                className="flex h-[60px] w-[60px] items-center justify-center border border-white transition-colors hover:bg-white hover:text-foreground"
              >
                <ChevronLeft className="h-7 w-7" strokeWidth={1.2} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Diapositiva siguiente"
                className="flex h-[60px] w-[60px] items-center justify-center border border-white transition-colors hover:bg-white hover:text-foreground"
              >
                <ChevronRight className="h-7 w-7" strokeWidth={1.2} />
              </button>
            </>
          )}
        </div>
      </div>

      <a
        href="#properties"
        aria-label="Bajar a los inmuebles"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white"
      >
        <ChevronDown className="h-9 w-9" strokeWidth={1.2} />
      </a>
    </section>
  );
}
