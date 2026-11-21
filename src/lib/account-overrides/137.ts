// Hardcoded overrides for account 137 (Inmobiliaria Ana Díaz), ported from the
// v1 template (vestawebpage, lib/account-overrides/137.ts) so the site can move
// to v2 looking the same. Lives in code because these are layout changes, not
// settings. When 137 gets its own repo, this file and the branches that read it
// go there. See docs/v1-a-v2.md.
//
// The orange (#E85D00) is NOT here: in v1 it was forced in code, in v2 it is
// the account's colour in website_config.color_props (a one-off SQL step in
// docs/v1-a-v2.md), so the agency can change it from the CRM.

export const ACCOUNT_137_ID = "137";

/**
 * True when we are rendering for this account.
 *
 * `accountId` is only passed by the CRM preview, which renders an ARBITRARY
 * account from this one deployment. Omitted everywhere else, where the
 * deployment's own env var is the right answer.
 */
export function isAccount137(accountId?: bigint | string): boolean {
  const id = accountId?.toString() ?? process.env.NEXT_PUBLIC_ACCOUNT_ID;
  return id === ACCOUNT_137_ID;
}

/** Deep forest green: the price on cards and on the property page, and the
 *  desktop nav links. The second accent alongside the orange. */
export const ACCOUNT_137_ACCENT_GREEN = "#0b3d1f";

/**
 * Footer «Tipos de Propiedades» (v1): every type with a short label, shown in
 * two columns. «Terrenos industriales» is Terreno › Suelo industrial in v2
 * (parseSearchSlug reads v1's /venta-terrenos-industriales).
 */
export const ACCOUNT_137_FOOTER_TYPES = [
  { key: "pisos", text: "Pisos", href: "/venta-pisos/todas-ubicaciones" },
  { key: "casas", text: "Casas", href: "/venta-casas/todas-ubicaciones" },
  { key: "locales", text: "Locales", href: "/venta-locales/todas-ubicaciones" },
  { key: "solares", text: "Terrenos", href: "/venta-solares/todas-ubicaciones" },
  { key: "garajes", text: "Garajes", href: "/venta-garajes/todas-ubicaciones" },
  { key: "edificios", text: "Edificios", href: "/venta-edificios/todas-ubicaciones" },
  { key: "oficinas", text: "Oficinas", href: "/venta-oficinas/todas-ubicaciones" },
  { key: "naves", text: "Naves", href: "/venta-naves-industriales/todas-ubicaciones" },
  { key: "terrenos-industriales", text: "Terrenos industriales", href: "/venta-terrenos-industriales/todas-ubicaciones" },
  { key: "trasteros", text: "Trasteros", href: "/venta-trasteros/todas-ubicaciones" },
];

/** Dark green of the search: the «Buscar» buttons and the home search labels,
 *  as on its v1 site (property-search.tsx, search-bar.tsx). */
export const ACCOUNT_137_SEARCH_GREEN = "#14532d";
