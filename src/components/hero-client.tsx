"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { VENTA_HREF } from "~/lib/listing-links";
import { useAspectoV1 } from "~/components/header-style-context";

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
  /**
   * `hero_props.buscador = "completo"`: the full search (server-rendered, so
   * it comes in as a slot). With it the hero shows v1's copy: subtitle, both
   * buttons and this search instead of the one-box HeroSearch.
   */
  fullSearch?: ReactNode;
  /** `hero_props.overlay = "claro"`: white wash, search only (see HeroProps). */
  lightOverlay?: boolean;
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
  v1 = false,
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
                // v1: en el móvil la ciudad va en su propia línea.
                className={v1 ? "block sm:inline-block" : "inline-block"}
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
  // subtitle / findPropertyButton / contactButton: only with `fullSearch`.
  // The default hero is title-only with a single-line search.
  subtitle,
  findPropertyButton,
  contactButton,
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
  fullSearch,
  lightOverlay = false,
}: HeroClientProps) {
  const { currentCity, rotatableCities } = useRotatingCity(cities);
  const v1 = useAspectoV1();
  const overlayStyle = {
    backgroundColor: lightOverlay
      ? "rgba(255, 255, 255, 0.4)"
      : `rgba(0, 0, 0, ${overlayOpacity})`,
  };
  const showDirectButtons = heroDirectAccess && directButtons.length > 0;

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
    v1,
  );

  // Los dos brillos difuminados que llevan todas las portadas de la v1.
  const orbes = (
    <>
      <motion.div
        className="pointer-events-none absolute left-10 top-20 h-64 w-64 rounded-full bg-gradient-to-r from-amber-400/10 to-rose-400/10 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-10 right-10 h-48 w-48 rounded-full bg-gradient-to-r from-blue-400/10 to-purple-400/10 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
    </>
  );

  // La portada clara de la v1 (137): el buscador centrado sobre el vídeo con
  // velo blanco, bajo la barra y no detrás (vestawebpage hero-client.tsx:129).
  if (fullSearch && lightOverlay && v1 && !showDirectButtons) {
    return (
      <section
        data-vesta="hero"
        className="relative isolate mb-8 overflow-hidden sm:mb-12 md:mb-[60px] lg:mb-[70px]"
      >
        {media.length > 0 ? (
          <HeroBackground media={media} layerClassName="absolute inset-0" overlayStyle={overlayStyle} />
        ) : (
          <div className="absolute inset-0 -z-10 bg-foreground/90" />
        )}
        {orbes}
        <h1 className="sr-only" data-vesta="hero.titulo">{title}</h1>
        <div className="relative z-10 mx-auto flex min-h-[52vh] w-full max-w-5xl items-center justify-center px-4 py-14 sm:min-h-[58vh] sm:px-6 lg:px-8">
          {fullSearch}
        </div>
      </section>
    );
  }

  // La portada de la v1 (`buscador: "completo"` sin velo claro; 21, 111 y 122
  // al pasar): título, subtítulo y botones a la izquierda, y el buscador debajo,
  // montado sobre el borde de la foto (vestawebpage page.tsx:160 y
  // hero-client.tsx:171). La foto va bajo la barra: arriba, su alto de más.
  if (fullSearch && !lightOverlay && !showDirectButtons) {
    return (
      <>
        <section
          data-vesta="hero"
          className="relative isolate -mt-20 mb-8 overflow-hidden sm:-mt-24 sm:mb-12 md:mb-[60px] lg:mb-[70px]"
        >
          {media.length > 0 ? (
            <HeroBackground media={media} layerClassName="absolute inset-0" overlayStyle={overlayStyle} />
          ) : (
            <div className="absolute inset-0 -z-10 bg-foreground/90" />
          )}
          {orbes}
          <div className="mx-auto max-w-7xl px-4 pb-20 pt-[6.5rem] sm:px-6 sm:pb-32 sm:pt-[8.5rem] md:pb-40 md:pt-32 lg:px-8 lg:pb-48 lg:pt-36">
            <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
              <motion.h1
                data-vesta="hero.titulo"
                className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {animatedTitle}
              </motion.h1>
              <motion.p
                data-vesta="hero.subtitulo"
                className="max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg md:text-xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
              >
                {subtitle}
              </motion.p>
              <motion.div
                className="flex max-w-md flex-col gap-3 pt-2 sm:flex-row sm:gap-4 sm:pt-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16 }}
              >
                <Link
                  href={VENTA_HREF}
                  className="flex h-11 whitespace-nowrap items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-transform hover:scale-105 hover:bg-white/90"
                  data-vesta="hero.boton-buscar"
                >
                  {findPropertyButton}
                </Link>
                {/* Screen-reader-only separator so scrapers don't glue the two labels. */}
                <span className="sr-only">. </span>
                <Link
                  href="/#contact"
                  className="flex h-11 whitespace-nowrap items-center justify-center rounded-md bg-brand px-8 text-sm font-medium text-brand-foreground transition-transform hover:scale-105 hover:bg-brand/90"
                  data-vesta="hero.boton-contacto"
                >
                  {contactButton}
                </Link>
              </motion.div>
            </div>
          </div>
        </section>
        <div className="relative z-20 -mt-16 px-4 sm:-mt-24 md:-mt-32 lg:-mt-40" data-vesta="hero.buscador">
          {fullSearch}
        </div>
      </>
    );
  }

  return (
    <section
      data-vesta="hero"
      className={`relative -mt-20 flex overflow-hidden sm:-mt-24 ${
        lightOverlay
          ? // The v1 light hero (137): only the search, centred, 52-58vh under the bar.
            "min-h-[calc(52vh_+_5rem)] sm:min-h-[calc(58vh_+_6rem)]"
          : heroSize === "full"
            ? "min-h-[calc(100svh_+_5rem)] sm:min-h-[calc(100svh_+_6rem)]"
            : "min-h-[88vh]"
      } ${showDirectButtons ? "items-end" : "items-center"}`}
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

      {/* Soft bottom fade for editorial feel (not on the light hero) */}
      {!lightOverlay && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
      )}

      <div
        className={`container mx-auto w-full px-4 sm:px-6 ${
          lightOverlay ? "pb-14 pt-[8.5rem] sm:pt-[9.5rem]" : "pb-20 pt-40 sm:pb-24 sm:pt-48 md:pb-28 md:pt-56"
        }`}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          {showDirectButtons ? (
            <motion.div
              // Wraps past three pills so a longer set doesn't squeeze each one
              // down to an unreadable sliver.
              className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {directButtons.map((button, i) => (
                <Link
                  key={`${button.label}-${button.href}`}
                  href={button.href}
                  data-vesta="hero.boton-directo"
                  data-vesta-i={i}
                  className="flex h-14 min-w-[8rem] flex-1 items-center justify-center rounded-full border border-white/40 bg-white/25 px-6 text-sm font-medium uppercase tracking-eyebrow text-white backdrop-blur-md transition-colors hover:bg-white/40"
                >
                  {button.label}
                </Link>
              ))}
            </motion.div>
          ) : lightOverlay ? (
            // Light hero: white copy wouldn't read on the wash, so only the
            // search shows. The title stays for Google and screen readers.
            <h1 className="sr-only" data-vesta="hero.titulo">{title}</h1>
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
              data-vesta="hero.titulo"
              className={`${fullSearch ? "mb-5" : "mb-12"} min-h-[2.1em] text-4xl font-medium leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl lg:text-[5.5rem]`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              {animatedTitle}
            </motion.h1>
          )}

          {fullSearch && !showDirectButtons && !lightOverlay && (
            <motion.div
              className="mb-10 flex flex-col items-center gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
            >
              <p
                className="max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg md:text-xl"
                data-vesta="hero.subtitulo"
              >
                {subtitle}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <Link
                  href={VENTA_HREF}
                  className="flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-medium text-black transition-colors hover:bg-white/90"
                  data-vesta="hero.boton-buscar"
                >
                  {findPropertyButton}
                </Link>
                {/* Screen-reader-only separator so scrapers don't glue the two labels. */}
                <span className="sr-only">. </span>
                <Link
                  href="/contacto"
                  className="flex h-12 items-center justify-center rounded-full bg-brand px-7 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                  data-vesta="hero.boton-contacto"
                >
                  {contactButton}
                </Link>
              </div>
            </motion.div>
          )}

          {!showDirectButtons && (
            <motion.div
              className="w-full"
              data-vesta="hero.buscador"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
            >
              {fullSearch ?? <HeroSearch placeholder={searchPlaceholder} />}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
