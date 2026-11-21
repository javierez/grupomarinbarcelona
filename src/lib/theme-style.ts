import { builtFonts, fontCatalog } from "~/app/fonts";
import {
  DEFAULT_SANS_KEY,
  DISPLAY_SERIF_KEY,
  FONT_DEFS,
  fontStackByName,
  googleFontsHref,
} from "~/lib/font-defs";
import { hexToHsl, mixWithBlack, readableForegroundHsl } from "~/lib/utils";
import {
  ACCOUNT_139_BRAND_DARKEN,
  ACCOUNT_139_WHITE_BRAND_FOREGROUND,
  isAccount139,
} from "~/lib/account-overrides/139";

export type ThemeColors = { primaryColor?: string; secondaryColor?: string };
export type ThemeFonts = { sansFamily?: string; headingFamily?: string };

/** Las variables que pone el tema en <body>; el resto de la web las lee. */
export const THEME_VARS = [
  "--font-geist-sans",
  "--font-cinzel",
  "--font-display-serif",
  "--brand",
  "--brand-foreground",
  // primaryColor tal cual: tinte del hero editorial, banda de contacto y pie
  // con footerBrand. Variable para que el borrador en vivo la cambie igual.
  "--brand-primary",
  // El texto que se lee sobre primaryColor: oscuro si es claro, blanco si es oscuro.
  "--brand-primary-foreground",
] as const;

export type SiteTheme = {
  vars: Partial<Record<(typeof THEME_VARS)[number], string>>;
  /** Hoja de Google para las familias que este build no compila. Solo en borrador. */
  googleFontsHref: string | null;
};

const compiled = fontCatalog as Partial<Record<string, { cssVar: string }>>;

function knownKey(key: string | undefined): string | undefined {
  return key && FONT_DEFS[key] ? key : undefined;
}

/**
 * Colores y fuentes de la web como variables CSS. Lo usan el layout (al
 * pintar) y el borrador en vivo (al recibir un cambio del CRM), así que los
 * dos dan lo mismo.
 *
 * Una familia que no está en este build (la agencia la cambió después del
 * último):
 * - en borrador (`googleFonts`), la agencia mirando su propia web: se pide a
 *   Google por su nombre, para que vea la que eligió;
 * - en la web publicada, nunca a Google (la IP de cada visitante): se queda
 *   la que se compiló en el build (`builtFonts`) hasta el siguiente.
 * Una fuente del sistema no se descarga: vale en las dos.
 */
export function siteTheme(
  colors: ThemeColors | null | undefined,
  fonts: ThemeFonts | null | undefined,
  accountId?: bigint | string,
  { googleFonts = false }: { googleFonts?: boolean } = {},
): SiteTheme {
  const sansKey = knownKey(fonts?.sansFamily) ?? DEFAULT_SANS_KEY;
  const headingKey = knownKey(fonts?.headingFamily) ?? sansKey;
  const sinBuild = [sansKey, headingKey, DISPLAY_SERIF_KEY].filter((k) => !compiled[k]);
  const valueOf = (key: string) =>
    compiled[key]?.cssVar ??
    (googleFonts || FONT_DEFS[key]?.source === "system" ? fontStackByName(key) : null);
  const sans = valueOf(sansKey) ?? compiled[builtFonts.sansFamily]?.cssVar;
  const heading = valueOf(headingKey) ?? compiled[builtFonts.headingFamily]?.cssVar ?? sans;

  const vars: SiteTheme["vars"] = {};
  const set = (name: (typeof THEME_VARS)[number], value: string | null | undefined) => {
    // `--font-cinzel: var(--font-cinzel)` es un ciclo y anula la fuente.
    if (value && value !== `var(${name})`) vars[name] = value;
  };
  // Sin ninguna, --font-geist-sans se queda en Geist (siempre en el build).
  set("--font-geist-sans", sans);
  set("--font-cinzel", heading);
  set("--font-display-serif", valueOf(DISPLAY_SERIF_KEY));

  set("--brand-primary", colors?.primaryColor);
  if (colors?.primaryColor) {
    set("--brand-primary-foreground", readableForegroundHsl(colors.primaryColor));
  }

  // Account 139 keeps its configured secondaryColor but lays a subtle dark tint
  // over the brand-coloured labels so the white text stands out a bit more, and
  // forces white text on them (its brand colour is light).
  const secondary = colors?.secondaryColor;
  if (secondary) {
    const is139 = isAccount139(accountId);
    set("--brand", hexToHsl(is139 ? mixWithBlack(secondary, ACCOUNT_139_BRAND_DARKEN) : secondary));
    set(
      "--brand-foreground",
      is139 && ACCOUNT_139_WHITE_BRAND_FOREGROUND ? "0 0% 98%" : readableForegroundHsl(secondary),
    );
  }

  return {
    vars,
    googleFontsHref: googleFonts ? googleFontsHref(sinBuild) : null,
  };
}
