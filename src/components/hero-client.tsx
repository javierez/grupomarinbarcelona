"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  CITY_PLACEHOLDER,
  extractCityTemplate,
} from "~/lib/city-template";
import { HeroSearch } from "~/components/hero-search";
import { HeroBackground } from "~/components/hero-background";
import { resolveHeroMedia, type HeroMediaItem } from "~/lib/hero-media";

interface HeroClientProps {
  title: string;
  subtitle: string;
  findPropertyButton: string;
  contactButton: string;
  /** Ordered background slides. Falls back to the legacy fields when empty. */
  backgroundMedia?: HeroMediaItem[];
  backgroundType?: "image" | "video";
  backgroundVideo?: string;
  backgroundImage?: string;
  cities?: string[];
  logoUrl?: string | null;
  heroSize?: "standard" | "full";
  heroDirectAccess?: boolean;
  /** Copy and destination of each direct-access pill, already resolved. */
  directButtons?: { label: string; href: string }[];
  /** Placeholder inside the search bar. Unset → the HeroSearch default. */
  searchPlaceholder?: string;
  /** Darkness of the overlay over the hero background (0–1). Default 0.35. */
  overlayOpacity?: number;
  /** Extra dark gradient at the top so the transparent navbar reads over bright media. */
  topScrim?: boolean;
}

// Accounts that show their logo in the hero instead of a text title.
const LOGO_HERO_ACCOUNTS = new Set<string>();
const USE_LOGO_HERO =
  !!process.env.NEXT_PUBLIC_ACCOUNT_ID &&
  LOGO_HERO_ACCOUNTS.has(process.env.NEXT_PUBLIC_ACCOUNT_ID);

const ROTATION_INTERVAL_MS = 4000;

function useRotatingCity(cities: string[] | undefined) {
  const rotatableCities = useMemo(
    () => (cities ?? []).filter((c) => c && c.trim().length > 0),
    [cities],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (rotatableCities.length < 2) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % rotatableCities.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [rotatableCities.length]);

  const safeIndex =
    rotatableCities.length > 0 ? index % rotatableCities.length : 0;
  return {
    currentCity: rotatableCities[safeIndex] ?? null,
    rotatableCities,
  };
}

function renderWithRotatingCity(
  text: string,
  knownCities: string[],
  currentCity: string | null,
) {
  const { template, foundCity } = extractCityTemplate(text, knownCities);
  if (!foundCity || !currentCity || knownCities.length < 2) {
    return <>{text}</>;
  }

  const segments = template.split(CITY_PLACEHOLDER);
  return (
    <>
      {segments.map((segment, i) => (
        <span key={`seg-${i}`}>
          {segment}
          {i < segments.length - 1 && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={currentCity}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="inline-block"
              >
                {currentCity}
              </motion.span>
            </AnimatePresence>
          )}
        </span>
      ))}
    </>
  );
}

export function HeroClient({
  title,
  // subtitle / findPropertyButton / contactButton intentionally unused
  // — hero is now title-only with a single-line search.
  backgroundMedia,
  backgroundType = "image",
  backgroundVideo,
  backgroundImage,
  cities = [],
  logoUrl,
  heroSize = "standard",
  heroDirectAccess = false,
  directButtons = [],
  searchPlaceholder,
  overlayOpacity = 0.35,
  topScrim = false,
}: HeroClientProps) {
  const { currentCity, rotatableCities } = useRotatingCity(cities);
  const overlayStyle = { backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` };

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

  const animatedTitle = renderWithRotatingCity(
    title,
    rotatableCities,
    currentCity,
  );

  return (
    <section
      className={`relative -mt-20 flex overflow-hidden sm:-mt-24 ${
        heroSize === "full"
          ? "min-h-[calc(100svh_+_5rem)] sm:min-h-[calc(100svh_+_6rem)]"
          : "min-h-[88vh]"
      } ${heroDirectAccess && directButtons.length > 0 ? "items-end" : "items-center"}`}
    >
      {/* Video and image background — fixed to viewport so it stays put while
          the hero scrolls past. The next section (page.tsx) has an opaque
          `bg-background` to cover the fixed layer once you scroll out of the hero. */}
      {media.length > 0 ? (
        <HeroBackground
          media={media}
          layerClassName="fixed inset-0 h-screen w-screen"
          overlayStyle={overlayStyle}
          overlayClassName={
            topScrim
              ? "bg-gradient-to-b from-black/60 via-black/20 to-transparent bg-[length:100%_14rem] bg-no-repeat"
              : ""
          }
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-foreground/90" />
      )}

      {/* Soft bottom fade for editorial feel */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="container mx-auto w-full px-4 pb-20 pt-40 sm:px-6 sm:pb-24 sm:pt-48 md:pb-28 md:pt-56">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          {heroDirectAccess && directButtons.length > 0 ? (
            <motion.div
              // Wraps past three pills so a longer set doesn't squeeze each one
              // down to an unreadable sliver.
              className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {directButtons.map((button) => (
                <Link
                  key={`${button.label}-${button.href}`}
                  href={button.href}
                  className="flex h-14 min-w-[8rem] flex-1 items-center justify-center rounded-full border border-white/40 bg-white/25 px-6 text-sm font-medium uppercase tracking-eyebrow text-white backdrop-blur-md transition-colors hover:bg-white/40"
                >
                  {button.label}
                </Link>
              ))}
            </motion.div>
          ) : USE_LOGO_HERO && logoUrl ? (
            <motion.div
              className="relative mb-12 aspect-[3019/745] w-full max-w-[34rem] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <Image
                src={logoUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 34rem, (max-width: 1024px) 56rem, 64rem"
                className="object-contain brightness-0 invert"
                priority
              />
            </motion.div>
          ) : (
            <motion.h1
              className="mb-12 min-h-[2.1em] text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl lg:text-[5.5rem]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {animatedTitle}
            </motion.h1>
          )}

          {!(heroDirectAccess && directButtons.length > 0) && (
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              <HeroSearch placeholder={searchPlaceholder} />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
