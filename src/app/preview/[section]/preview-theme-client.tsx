"use client";

import { useEffect, useState } from "react";
import { fontCatalog } from "~/app/fonts";
import { hexToHsl, readableForegroundHsl } from "~/lib/utils";
import type { FontFamilyKey } from "~/lib/data";

export interface PreviewColorProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export interface PreviewFontProps {
  sansFamily?: FontFamilyKey;
  headingFamily?: FontFamilyKey;
}

interface Patch {
  colorProps?: PreviewColorProps;
  fontProps?: PreviewFontProps;
}

/**
 * Applies the account's colours and fonts to everything inside it, and keeps
 * following the editor live.
 *
 * A wrapper rather than a page of its own because the CRM previews colours on
 * the real homepage: the agency needs to see the brand colour on the hero, the
 * cards and the buttons at once, not on a mock. `PreviewGlobalsClient` renders
 * its own Navbar + Hero, so mounting *that* inside `PreviewHome` would paint a
 * second copy of both.
 */
export function PreviewThemeClient({
  initialColors,
  initialFonts,
  children,
}: {
  initialColors: PreviewColorProps | null;
  initialFonts: PreviewFontProps | null;
  children: React.ReactNode;
}) {
  const [colors, setColors] = useState<PreviewColorProps>(initialColors ?? {});
  const [fonts, setFonts] = useState<PreviewFontProps>(initialFonts ?? {});

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
      ) {
        return;
      }
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
      {children}
    </div>
  );
}

/**
 * The inline style that carries a theme.
 *
 * `fontFamily` is set directly and not only as a CSS variable: descendants that
 * merely inherit — the hero's `<h1>`, for one — never read `--font-geist-sans`,
 * so setting the variable alone changed the font everywhere except the places
 * you were looking at.
 */
export function themeCssVars(
  colors: PreviewColorProps,
  fonts: PreviewFontProps,
): React.CSSProperties {
  const sansKey = fonts.sansFamily ?? "geist";
  const headingKey = fonts.headingFamily ?? sansKey;
  const cat = fontCatalog as Partial<Record<string, { cssVar: string }>>;
  const sansVar =
    cat[sansKey]?.cssVar ?? cat.geist?.cssVar ?? "var(--font-geist-sans)";
  const headingVar = cat[headingKey]?.cssVar ?? sansVar;
  const brandHsl = colors.secondaryColor
    ? hexToHsl(colors.secondaryColor)
    : null;
  const brandFgHsl = colors.secondaryColor
    ? readableForegroundHsl(colors.secondaryColor)
    : null;

  return {
    ["--font-geist-sans" as string]: sansVar,
    ["--font-cinzel" as string]: headingVar,
    fontFamily: sansVar,
    ...(brandHsl ? { ["--brand" as string]: brandHsl } : {}),
    ...(brandFgHsl ? { ["--brand-foreground" as string]: brandFgHsl } : {}),
  } as React.CSSProperties;
}
