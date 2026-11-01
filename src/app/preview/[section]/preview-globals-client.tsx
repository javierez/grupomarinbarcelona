"use client";

import { useEffect, useState } from "react";
import { HeroClient } from "~/components/hero-client";
import Navbar from "~/components/navbar";
import { themeCssVars } from "./preview-theme-client";
import type {
  PreviewColorProps as ColorProps,
  PreviewFontProps as FontProps,
} from "./preview-theme-client";
import type { HeroProps } from "~/lib/data";
import type { SocialLink } from "~/components/ui/social-links";

interface Patch {
  colorProps?: ColorProps;
  fontProps?: FontProps;
}

export function PreviewGlobalsClient({
  initialColors,
  initialFonts,
  hero,
  cities,
  shortName,
  logoUrl,
  socialLinks,
  promotionsEnabled,
}: {
  initialColors: ColorProps | null;
  initialFonts: FontProps | null;
  hero: HeroProps | null;
  cities: string[];
  shortName: string;
  logoUrl: string | null;
  socialLinks: SocialLink[];
  promotionsEnabled: boolean;
}) {
  const [colors, setColors] = useState<ColorProps>(initialColors ?? {});
  const [fonts, setFonts] = useState<FontProps>(initialFonts ?? {});

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: Patch;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        (data.section !== "colors" && data.section !== "fonts")
      )
        return;
      const patch = data.patch ?? {};
      if (patch.colorProps)
        setColors((prev) => ({ ...prev, ...patch.colorProps }));
      if (patch.fontProps)
        setFonts((prev) => ({ ...prev, ...patch.fontProps }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div style={themeCssVars(colors, fonts)} className="font-sans">
      <Navbar
        shortName={shortName}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
        primaryColor={colors.primaryColor ?? null}
        promotionsEnabled={promotionsEnabled}
      />
      <HeroClient
        title={hero?.title ?? "Encuentra Tu Propiedad Soñada"}
        subtitle={hero?.subtitle ?? "Descubre propiedades excepcionales."}
        findPropertyButton={hero?.findPropertyButton ?? "Explorar Propiedades"}
        contactButton={hero?.contactButton ?? "Contáctanos"}
        backgroundType={hero?.backgroundType ?? "image"}
        backgroundVideo={hero?.backgroundVideo}
        backgroundImage={hero?.backgroundImage}
        cities={cities}
      />
    </div>
  );
}
