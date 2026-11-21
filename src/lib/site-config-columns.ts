/**
 * Las columnas de `website_config` que la agencia edita, y cómo se pone un
 * borrador encima (docs/plan/web-por-chat-contrato.md §1).
 *
 * El snapshot de `website_config_versions` lleva estas columnas en snake_case
 * con el valor tal cual se guarda (texto JSON). No entran id, account_id,
 * vercel_project, last_published_at, rebuild_history ni las fechas.
 */

export const SITE_CONFIG_COLUMNS = {
  social_links: "socialLinks",
  seo_props: "seoProps",
  logo: "logo",
  logotype: "logotype",
  favicon: "favicon",
  hero_props: "heroProps",
  featured_props: "featuredProps",
  about_props: "aboutProps",
  properties_props: "propertiesProps",
  testimonial_props: "testimonialProps",
  contact_props: "contactProps",
  footer_props: "footerProps",
  head_props: "headProps",
  watermark_props: "watermarkProps",
  metadata: "metadata",
  links_props: "linksProps",
  color_props: "colorProps",
  font_props: "fontProps",
  promo_cards_props: "promoCardsProps",
  banner_props: "bannerProps",
  faqs_props: "faqsProps",
  features_props: "featuresProps",
  blog_props: "blogProps",
} as const;

type SnakeKey = keyof typeof SITE_CONFIG_COLUMNS;
export type SiteConfigKey = (typeof SITE_CONFIG_COLUMNS)[SnakeKey];

/** Una fila de website_config con lo que pinta la web. Todo es texto en la base. */
export type SiteConfigRow = Record<SiteConfigKey, string | null>;

export const SITE_CONFIG_KEYS = Object.values(SITE_CONFIG_COLUMNS);

/** §4: la etiqueta que /api/revalidar invalida. */
export function siteConfigTag(accountId: string): string {
  return `web-${accountId}`;
}

function comoTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  return typeof valor === "string" ? valor : JSON.stringify(valor);
}

/**
 * El borrador encima de lo publicado. Lo que el snapshot no trae se queda como
 * está; una clave que no es columna editable se ignora. Si llega un valor ya
 * parseado (jsonb), se vuelve a texto, que es lo que leen los getters.
 */
export function mergeDraft(
  row: SiteConfigRow | null,
  snapshot: unknown,
): SiteConfigRow | null {
  if (typeof snapshot !== "object" || snapshot === null || Array.isArray(snapshot)) {
    return row;
  }
  const merged = row
    ? { ...row }
    : (Object.fromEntries(SITE_CONFIG_KEYS.map((k) => [k, null])) as SiteConfigRow);
  for (const [columna, valor] of Object.entries(snapshot)) {
    if (!Object.hasOwn(SITE_CONFIG_COLUMNS, columna)) continue;
    merged[SITE_CONFIG_COLUMNS[columna as SnakeKey]] = comoTexto(valor);
  }
  return merged;
}
