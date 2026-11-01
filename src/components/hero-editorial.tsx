"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeroBackground } from "~/components/hero-background";
import { resolveHeroMedia, type HeroMediaItem } from "~/lib/hero-media";
import { CITY_PLACEHOLDER } from "~/lib/city-template";
import { VENTA_HREF } from "~/lib/listing-links";

interface HeroEditorialProps {
  title: string;
  subtitle: string;
  findPropertyButton: string;
  contactButton: string;
  backgroundMedia?: HeroMediaItem[];
  backgroundType?: "image" | "video";
  backgroundVideo?: string;
  backgroundImage?: string;
  cities?: string[];
  heroSize?: "standard" | "full";
  /** Account primary colour: tints the media so the copy reads on the left. */
  brandColor?: string | null;
}

const FALLBACK_TINT = "#141a26";

/**
 * Hero of the "editorial" site style (features_props.siteStyle): copy on the
 * left over a brand-coloured tint, with two calls to action instead of the
 * search bar. The standard hero stays in hero-client.tsx.
 */
export function HeroEditorial({
  title,
  subtitle,
  findPropertyButton,
  contactButton,
  backgroundMedia,
  backgroundType = "image",
  backgroundVideo,
  backgroundImage,
  cities = [],
  heroSize = "standard",
  brandColor,
}: HeroEditorialProps) {
  const media = useMemo(
    () =>
      resolveHeroMedia({
        backgroundMedia,
        backgroundType,
        backgroundVideo,
        backgroundImage,
      }),
    [backgroundMedia, backgroundType, backgroundVideo, backgroundImage],
  );
  const tint = brandColor ?? FALLBACK_TINT;
  const mix = (pct: number) =>
    `color-mix(in srgb, ${tint} ${pct}%, transparent)`;
  const overlayStyle = {
    backgroundImage: `linear-gradient(90deg, ${mix(94)} 0%, ${mix(80)} 40%, ${mix(22)} 78%)`,
  };
  // No rotating city here: a static headline suits the left-aligned layout.
  const staticTitle = title.replaceAll(CITY_PLACEHOLDER, cities[0] ?? "");

  return (
    <section
      className={`relative -mt-20 flex items-center overflow-hidden sm:-mt-24 ${
        heroSize === "full"
          ? "min-h-[calc(100svh_+_5rem)] sm:min-h-[calc(100svh_+_6rem)]"
          : "min-h-[88vh]"
      }`}
    >
      {media.length > 0 ? (
        <HeroBackground
          media={media}
          layerClassName="fixed inset-0 h-screen w-screen"
          overlayStyle={overlayStyle}
        />
      ) : (
        <div
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: tint }}
        />
      )}

      <div className="container mx-auto w-full px-4 pb-20 pt-40 sm:px-6 sm:pb-24 sm:pt-48">
        <motion.div
          className="max-w-3xl text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <h1 className="text-4xl font-normal leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {staticTitle}
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/90 sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href={VENTA_HREF}
              className="bg-brand px-7 py-3.5 text-sm font-medium uppercase tracking-eyebrow text-brand-foreground transition-colors hover:bg-brand/90"
            >
              {findPropertyButton}
            </Link>
            <Link
              href="/contacto"
              className="border border-white/70 px-7 py-3.5 text-sm font-medium uppercase tracking-eyebrow text-white transition-colors hover:bg-white/10"
            >
              {contactButton}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
