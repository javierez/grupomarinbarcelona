/**
 * Idiomas del selector de la web. Puro: lo importan el servidor (layout, ficha)
 * y el cliente (selector, descripción).
 *
 * El selector traduce los textos de la web con GTranslate y, en la ficha,
 * cambia la descripción por la traducción que el CRM ya tiene guardada en
 * `listings.description_translations` cuando existe para ese idioma. Aquí no
 * se genera ninguna traducción.
 *
 * Los códigos son los de `listing-languages.ts` del CRM: hay que cambiarlos a
 * la vez.
 */

export interface SiteLanguage {
  code: string;
  /** Nombre en su propio idioma: es lo que busca quien no lee castellano. */
  name: string;
  /** Código que entiende GTranslate cuando no coincide con el nuestro. */
  gt?: string;
  /**
   * Bandera del selector «simple» (el de las webs eGO). Portugués lleva la de
   * Brasil porque el «pt» de Google Translate es portugués de Brasil.
   */
  flag?: string;
}

export const DEFAULT_LANG = "es";

export const SITE_LANGUAGES: readonly SiteLanguage[] = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "nl", name: "Nederlands" },
  { code: "ca", name: "Català" },
  { code: "ru", name: "Русский" },
  { code: "pl", name: "Polski" },
  { code: "sv", name: "Svenska" },
  { code: "no", name: "Norsk" },
  { code: "da", name: "Dansk" },
  { code: "fi", name: "Suomi" },
  { code: "zh", name: "中文", gt: "zh-CN" },
  { code: "ro", name: "Română" },
  { code: "el", name: "Ελληνικά" },
  { code: "uk", name: "Українська" },
];

const BY_CODE = new Map(SITE_LANGUAGES.map((l) => [l.code, l]));

export function getSiteLanguage(code: string): SiteLanguage | undefined {
  return BY_CODE.get(code);
}

/** El código que hay que pasarle a GTranslate para `code`. */
export function gtCode(code: string): string {
  return BY_CODE.get(code)?.gt ?? code;
}

/**
 * Los idiomas que ofrece el selector, sin contar el castellano. Vacío = la web
 * no enseña selector.
 *
 * · `accountLanguages`: `accounts.preferences.listingLanguages`, los idiomas a
 *   los que la agencia traduce sus anuncios. Tolera basura: nadie valida ese
 *   jsonb.
 * · `switcherFlag`: `features.languageSwitcher`, el ES/EN de Kit Digital.
 */
export function siteLanguagesFor(input: {
  accountLanguages: unknown;
  switcherFlag: boolean;
}): string[] {
  const langs = new Set<string>();
  if (input.switcherFlag) langs.add("en");
  if (Array.isArray(input.accountLanguages)) {
    for (const v of input.accountLanguages) {
      if (typeof v === "string" && v !== DEFAULT_LANG && BY_CODE.has(v)) {
        langs.add(v);
      }
    }
  }
  // En el orden del catálogo, para que el menú no baile entre agencias.
  return SITE_LANGUAGES.map((l) => l.code).filter((c) => langs.has(c));
}

/**
 * El idioma guardado por GTranslate en localStorage (`{ tgtLang }`), si la web
 * lo ofrece; si no, castellano. Acepta su código (`zh-CN`) o el nuestro.
 */
export function parseStoredLang(
  raw: string | null,
  offered: readonly string[],
): string {
  if (!raw) return DEFAULT_LANG;
  try {
    const tgt = (JSON.parse(raw) as { tgtLang?: unknown } | null)?.tgtLang;
    if (typeof tgt !== "string") return DEFAULT_LANG;
    return offered.find((c) => c === tgt || gtCode(c) === tgt) ?? DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

/**
 * Las traducciones guardadas que siguen describiendo la descripción actual:
 * `{ lang: text }`. `sourceHash` es el SHA-256 del castellano de hoy; una
 * traducción hecha de un texto anterior no se enseña nunca.
 */
export function inSyncTranslations(
  translations: unknown,
  sourceHash: string,
): Record<string, string> {
  if (!translations || typeof translations !== "object") return {};
  const out: Record<string, string> = {};
  for (const [lang, t] of Object.entries(translations)) {
    const entry = t as { text?: unknown; hash?: unknown } | null;
    const text = typeof entry?.text === "string" ? entry.text.trim() : "";
    if (text && entry?.hash === sourceHash && BY_CODE.has(lang)) {
      out[lang] = text;
    }
  }
  return out;
}

/** Aviso que el selector lanza en `window` al cambiar de idioma. */
export const LANG_EVENT = "site-language-change";
