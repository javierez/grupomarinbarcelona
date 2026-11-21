/**
 * The site's font catalogue: one entry per `FontFamilyKey`.
 *
 * Read by the generator (scripts/generate-site/font-definitions.ts), which
 * writes each site's `src/app/fonts.ts` with only the families that agency
 * chose, and by the layout: a family chosen later, after the last build,
 * is not compiled in, so it is loaded from Google Fonts by name until the
 * next build compiles it (`googleFontsHref`). Keep in sync with src/app/fonts.ts.
 */

export type FontDef = {
  key: string; // camelCase catalog key (e.g. "plusJakarta")
  importName: string; // next/font/google export name (e.g. "Plus_Jakarta_Sans")
  source: "next" | "geist" | "system"; // which package provides it
  varName: string; // local const name used inside fonts.ts
  // For "next"/"geist": the CSS variable the loader exposes (e.g. "--font-x").
  // For "system": the literal font-family stack (no webfont download).
  cssVar: string;
  weights?: string[]; // required for non-variable fonts
  serif?: true; // generic family for the fallback stack
};

export const FONT_DEFS: Record<string, FontDef> = {
  // System (no webfont download — uses the OS Helvetica with graceful fallbacks)
  helvetica: { key: "helvetica", importName: "", source: "system", varName: "SYSTEM_LOADER", cssVar: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  // Tier 1
  geist: { key: "geist", importName: "GeistSans", source: "geist", varName: "GeistSans", cssVar: "--font-geist-sans" },
  inter: { key: "inter", importName: "Inter", source: "next", varName: "inter", cssVar: "--font-inter" },
  poppins: { key: "poppins", importName: "Poppins", source: "next", varName: "poppins", cssVar: "--font-poppins", weights: ["300", "400", "500", "600", "700"] },
  montserrat: { key: "montserrat", importName: "Montserrat", source: "next", varName: "montserrat", cssVar: "--font-montserrat" },
  roboto: { key: "roboto", importName: "Roboto", source: "next", varName: "roboto", cssVar: "--font-roboto", weights: ["300", "400", "500", "700"] },
  robotoCondensed: { key: "robotoCondensed", importName: "Roboto_Condensed", source: "next", varName: "robotoCondensed", cssVar: "--font-roboto-condensed" },
  lato: { key: "lato", importName: "Lato", source: "next", varName: "lato", cssVar: "--font-lato", weights: ["300", "400", "700", "900"] },
  openSans: { key: "openSans", importName: "Open_Sans", source: "next", varName: "openSans", cssVar: "--font-open-sans" },
  playfair: { key: "playfair", importName: "Playfair_Display", source: "next", varName: "playfair", cssVar: "--font-playfair", serif: true },
  cinzel: { key: "cinzel", importName: "Cinzel", source: "next", varName: "cinzel", cssVar: "--font-cinzel", weights: ["400", "500", "600", "700"], serif: true },
  cormorant: { key: "cormorant", importName: "Cormorant_Garamond", source: "next", varName: "cormorant", cssVar: "--font-cormorant", weights: ["300", "400", "500", "600", "700"], serif: true },

  // Tier 2 — modern sans
  manrope: { key: "manrope", importName: "Manrope", source: "next", varName: "manrope", cssVar: "--font-manrope" },
  dmSans: { key: "dmSans", importName: "DM_Sans", source: "next", varName: "dmSans", cssVar: "--font-dm-sans" },
  plusJakarta: { key: "plusJakarta", importName: "Plus_Jakarta_Sans", source: "next", varName: "plusJakarta", cssVar: "--font-plus-jakarta" },
  workSans: { key: "workSans", importName: "Work_Sans", source: "next", varName: "workSans", cssVar: "--font-work-sans" },
  outfit: { key: "outfit", importName: "Outfit", source: "next", varName: "outfit", cssVar: "--font-outfit" },
  figtree: { key: "figtree", importName: "Figtree", source: "next", varName: "figtree", cssVar: "--font-figtree" },
  sora: { key: "sora", importName: "Sora", source: "next", varName: "sora", cssVar: "--font-sora" },
  spaceGrotesk: { key: "spaceGrotesk", importName: "Space_Grotesk", source: "next", varName: "spaceGrotesk", cssVar: "--font-space-grotesk" },
  urbanist: { key: "urbanist", importName: "Urbanist", source: "next", varName: "urbanist", cssVar: "--font-urbanist" },

  // Tier 2 — classic/friendly sans
  nunito: { key: "nunito", importName: "Nunito", source: "next", varName: "nunito", cssVar: "--font-nunito" },
  raleway: { key: "raleway", importName: "Raleway", source: "next", varName: "raleway", cssVar: "--font-raleway" },
  mulish: { key: "mulish", importName: "Mulish", source: "next", varName: "mulish", cssVar: "--font-mulish" },
  sourceSans: { key: "sourceSans", importName: "Source_Sans_3", source: "next", varName: "sourceSans", cssVar: "--font-source-sans" },
  karla: { key: "karla", importName: "Karla", source: "next", varName: "karla", cssVar: "--font-karla" },
  rubik: { key: "rubik", importName: "Rubik", source: "next", varName: "rubik", cssVar: "--font-rubik" },
  quicksand: { key: "quicksand", importName: "Quicksand", source: "next", varName: "quicksand", cssVar: "--font-quicksand" },

  // Tier 2 — serif
  merriweather: { key: "merriweather", importName: "Merriweather", source: "next", varName: "merriweather", cssVar: "--font-merriweather", weights: ["300", "400", "700", "900"], serif: true },
  lora: { key: "lora", importName: "Lora", source: "next", varName: "lora", cssVar: "--font-lora", serif: true },
  ebGaramond: { key: "ebGaramond", importName: "EB_Garamond", source: "next", varName: "ebGaramond", cssVar: "--font-eb-garamond", serif: true },
  libreBaskerville: { key: "libreBaskerville", importName: "Libre_Baskerville", source: "next", varName: "libreBaskerville", cssVar: "--font-libre-baskerville", weights: ["400", "700"], serif: true },
  dmSerif: { key: "dmSerif", importName: "DM_Serif_Display", source: "next", varName: "dmSerif", cssVar: "--font-dm-serif", weights: ["400"], serif: true },
  fraunces: { key: "fraunces", importName: "Fraunces", source: "next", varName: "fraunces", cssVar: "--font-fraunces", serif: true },
  bodoni: { key: "bodoni", importName: "Bodoni_Moda", source: "next", varName: "bodoni", cssVar: "--font-bodoni", serif: true },

  // Tier 2 — display
  syne: { key: "syne", importName: "Syne", source: "next", varName: "syne", cssVar: "--font-syne" },
  unbounded: { key: "unbounded", importName: "Unbounded", source: "next", varName: "unbounded", cssVar: "--font-unbounded" },
  bricolage: { key: "bricolage", importName: "Bricolage_Grotesque", source: "next", varName: "bricolage", cssVar: "--font-bricolage" },
};

/** Default sans when an agency has no `font_props` (the layout's default). */
export const DEFAULT_SANS_KEY = "dmSans";
/** `font-display` (blog, 404, KPI blocks) is always this serif. */
export const DISPLAY_SERIF_KEY = "cormorant";

function googleFamily(def: FontDef): string {
  return def.importName.replace(/_/g, " ");
}

/**
 * CSS value for a family that is NOT compiled into this build: its Google
 * name plus a generic fallback. System stacks are returned as they are.
 * null for an unknown key.
 */
export function fontStackByName(key: string): string | null {
  const def = FONT_DEFS[key];
  if (!def) return null;
  if (def.source === "system") return def.cssVar;
  return `"${googleFamily(def)}", ${def.serif ? "serif" : "sans-serif"}`;
}

/** One Google Fonts stylesheet for these families, or null if none of them is on Google. */
export function googleFontsHref(keys: readonly string[]): string | null {
  const families = Array.from(new Set(keys))
    .map((k) => FONT_DEFS[k])
    .filter((d): d is FontDef => d?.source === "next")
    .map((d) => {
      const weights = d.weights ?? ["400", "500", "600", "700"];
      return `family=${googleFamily(d).replace(/ /g, "+")}:wght@${weights.join(";")}`;
    });
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
