"use client";

import { useEffect, useMemo, useState } from "react";
import { HeroClient } from "~/components/hero-client";
import { VENTA_HREF, ALQUILER_HREF } from "~/lib/listing-links";
import type { HeroProps } from "~/lib/data";
import type { FeaturesProps } from "~/server/queries/website-config";
import { heroDirectButtonSchema } from "~/server/promo-cards/dsl-types";
import { hrefForCard } from "~/server/promo-cards/href";

const HERO_FALLBACK: HeroProps = {
  title: "Encuentra Tu Propiedad Soñada",
  subtitle: "Descubre propiedades excepcionales en ubicaciones privilegiadas.",
  findPropertyButton: "Explorar Propiedades",
  contactButton: "Contáctanos",
  backgroundType: "image",
};

/** Same pair `hero.tsx` falls back to when no button is configured. */
const DEFAULT_DIRECT_BUTTONS = [
  { label: "Venta", href: VENTA_HREF },
  { label: "Alquiler", href: ALQUILER_HREF },
];

interface Props {
  initialProps: HeroProps | null;
  initialFeatures: FeaturesProps | null;
  cities: string[];
}

/**
 * The editor sends `{ heroProps, featuresProps }`, but older CRM builds sent a
 * bare `HeroProps`. Both are accepted so the preview app can be deployed before
 * the CRM change reaches production without the hero going dead in between.
 */
type HeroPatch =
  | { heroProps?: Partial<HeroProps>; featuresProps?: FeaturesProps }
  | Partial<HeroProps>;

function splitPatch(patch: HeroPatch): {
  hero?: Partial<HeroProps>;
  features?: FeaturesProps;
} {
  if ("heroProps" in patch || "featuresProps" in patch) {
    const keyed = patch as {
      heroProps?: Partial<HeroProps>;
      featuresProps?: FeaturesProps;
    };
    return { hero: keyed.heroProps, features: keyed.featuresProps };
  }
  return { hero: patch as Partial<HeroProps> };
}

/**
 * A button being typed in the editor is invalid for most of its life — no
 * label yet, no slug yet — so each one is validated on its own and the bad
 * ones are skipped. Rejecting the whole array would blank every pill the
 * moment you started adding another.
 */
function resolveDirectButtons(raw: unknown): { label: string; href: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = heroDirectButtonSchema.safeParse(item);
    if (!parsed.success) return [];
    return [{ label: parsed.data.label, href: hrefForCard(parsed.data) }];
  });
}

export function PreviewHeroClient({
  initialProps,
  initialFeatures,
  cities,
}: Props) {
  const [hero, setHero] = useState<HeroProps>(initialProps ?? HERO_FALLBACK);
  const [features, setFeatures] = useState<FeaturesProps>(
    initialFeatures ?? {},
  );

  useEffect(() => {
    // Announce ready so the parent can push the initial form state.
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");

    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: HeroPatch;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "hero"
      ) {
        return;
      }
      // Merge incoming patch over current state. Lenient by design — the
      // admin form may send partial values.
      const { hero: heroPatch, features: featuresPatch } = splitPatch(
        data.patch ?? {},
      );
      if (heroPatch) setHero((prev) => ({ ...prev, ...heroPatch }));
      if (featuresPatch) setFeatures((prev) => ({ ...prev, ...featuresPatch }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const directButtons = useMemo(() => {
    const configured = resolveDirectButtons(features.heroDirectButtons);
    return configured.length > 0 ? configured : DEFAULT_DIRECT_BUTTONS;
  }, [features.heroDirectButtons]);

  const placeholder = features.heroSearchPlaceholder?.trim();

  return (
    <HeroClient
      title={hero.title}
      subtitle={hero.subtitle}
      findPropertyButton={hero.findPropertyButton}
      contactButton={hero.contactButton}
      backgroundMedia={hero.backgroundMedia}
      backgroundType={hero.backgroundType}
      backgroundVideo={hero.backgroundVideo}
      backgroundImage={hero.backgroundImage}
      cities={cities}
      heroSize={features.heroSize ?? "standard"}
      heroDirectAccess={features.heroDirectAccess === true}
      directButtons={directButtons}
      searchPlaceholder={placeholder === "" ? undefined : placeholder}
      overlayOpacity={features.heroOverlayOpacity ?? 0.35}
    />
  );
}
