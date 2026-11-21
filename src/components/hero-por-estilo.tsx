"use client";

import type { ReactNode } from "react";
import type { HeroProps } from "~/lib/data";
import { resolveHeroMedia } from "~/lib/hero-media";
import type { FeaturesProps } from "~/server/queries/website-config";
import { HeroClient } from "./hero-client";
import { HeroEditorial } from "./hero-editorial";
import { HeroV3 } from "./v3/hero-v3";

/**
 * Qué portada sale (v3, editorial o la de siempre) y con qué textos. La usan
 * la web (`hero.tsx`) y la vista previa del CRM (`preview-hero-client.tsx`):
 * la vista previa tenía su propia copia, se quedó en la de siempre y Muñoz
 * Espasande (editorial) veía en el editor otra portada que en su web
 * (17-nov-2026).
 */
export function HeroPorEstilo({
  hero,
  features,
  cities,
  logoUrl,
  brandColor,
  directButtons,
  fullSearch,
}: {
  hero: HeroProps | null;
  features: FeaturesProps;
  cities: string[];
  logoUrl?: string | null;
  brandColor?: string | null;
  directButtons: { label: string; href: string }[];
  /** El buscador completo (`hero_props.buscador = "completo"`), ya montado. */
  fullSearch?: ReactNode;
}) {
  // Blank is a real, saved value here ("use the default copy"), so it has to
  // become undefined rather than reach the input as an empty placeholder.
  const trimmedPlaceholder = features.heroSearchPlaceholder?.trim();
  const searchPlaceholder =
    trimmedPlaceholder === "" ? undefined : trimmedPlaceholder;

  const title = hero?.title || "Encuentra Tu Propiedad Soñada";
  const subtitle =
    hero?.subtitle ||
    "Descubre propiedades excepcionales en ubicaciones privilegiadas. Permítenos guiarte en tu viaje inmobiliario.";
  const findPropertyButton = hero?.findPropertyButton || "Explorar Propiedades";
  const contactButton =
    features.menuLabels?.contacto || hero?.contactButton || "Contáctanos";
  const backgroundMedia = hero?.backgroundMedia;
  const backgroundType = hero?.backgroundType || "image";
  const backgroundVideo = hero?.backgroundVideo;
  const backgroundImage = hero?.backgroundImage;

  if (features.heroStyle === "v3") {
    const media = resolveHeroMedia(hero);
    const configured = hero?.slides?.filter((s) => s.title?.trim()) ?? [];
    const slides = (
      configured.length > 0
        ? configured
        : [{ title, subtitle, buttonText: findPropertyButton }]
    ).map((s, i) => ({
      title: s.title,
      subtitle: s.subtitle,
      buttonText: s.buttonText,
      href: ("href" in s && s.href) || "#properties",
      media:
        "image" in s && s.image
          ? { url: s.image, type: "image" as const }
          : (media[i % Math.max(media.length, 1)] ?? null),
    }));
    return (
      <HeroV3
        slides={slides}
        poster={backgroundImage}
        overlayOpacity={features.heroOverlayOpacity ?? 0.38}
      />
    );
  }

  if (features.siteStyle === "editorial") {
    return (
      <HeroEditorial
        title={title}
        subtitle={subtitle}
        findPropertyButton={findPropertyButton}
        contactButton={contactButton}
        backgroundMedia={backgroundMedia}
        backgroundType={backgroundType}
        backgroundVideo={backgroundVideo}
        backgroundImage={backgroundImage}
        cities={cities}
        heroSize={features.heroSize ?? "standard"}
        brandColor={brandColor}
      />
    );
  }

  return (
    <HeroClient
      title={title}
      subtitle={subtitle}
      findPropertyButton={findPropertyButton}
      contactButton={contactButton}
      backgroundMedia={backgroundMedia}
      backgroundType={backgroundType}
      backgroundVideo={backgroundVideo}
      backgroundImage={backgroundImage}
      cities={cities}
      logoUrl={logoUrl}
      heroSize={features.heroSize ?? "standard"}
      heroDirectAccess={features.heroDirectAccess === true}
      directButtons={directButtons}
      searchPlaceholder={searchPlaceholder}
      overlayOpacity={features.heroOverlayOpacity ?? 0.35}
      topScrim={features.heroTopScrim === true}
      fullSearch={hero?.buscador === "completo" ? fullSearch : undefined}
      lightOverlay={hero?.overlay === "claro"}
    />
  );
}
