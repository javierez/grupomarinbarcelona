/**
 * Property-card heading + location configuration (stored per account in
 * `website_config.properties_props.cardDisplay`). Kept in a plain module so it
 * can be shared by the "use server" config query and client card components.
 *
 * - `cardTitle`: what the big heading shows — the listing's own title, the
 *   location label, or nothing.
 * - `cardEyebrow`: the small row above the heading — the location label or
 *   nothing. Auto-suppressed when `cardTitle` is already "location".
 * - `cardLocationField`: which secondary field is appended after the city when
 *   building the location label (city › <field>), with graceful fallback.
 */
export type CardDisplayConfig = {
  cardTitle: "listing" | "location" | "none";
  cardEyebrow: "location" | "none";
  cardLocationField: "neighborhood" | "municipality" | "province";
};

export const DEFAULT_CARD_DISPLAY: CardDisplayConfig = {
  cardTitle: "listing",
  cardEyebrow: "location",
  cardLocationField: "province",
};

const TITLE_OPTIONS = ["listing", "location", "none"] as const;
const EYEBROW_OPTIONS = ["location", "none"] as const;
const FIELD_OPTIONS = ["neighborhood", "municipality", "province"] as const;

/** Pick `value` when it's one of `options`, else fall back. */
function pickOption<T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  return (options as readonly string[]).includes(value as string)
    ? (value as T)
    : fallback;
}

/** Coerce a possibly-partial/invalid stored value into a complete config. */
export function resolveCardDisplay(raw: unknown): CardDisplayConfig {
  const partial = (raw ?? {}) as Record<string, unknown>;
  return {
    cardTitle: pickOption(
      partial.cardTitle,
      TITLE_OPTIONS,
      DEFAULT_CARD_DISPLAY.cardTitle,
    ),
    cardEyebrow: pickOption(
      partial.cardEyebrow,
      EYEBROW_OPTIONS,
      DEFAULT_CARD_DISPLAY.cardEyebrow,
    ),
    cardLocationField: pickOption(
      partial.cardLocationField,
      FIELD_OPTIONS,
      DEFAULT_CARD_DISPLAY.cardLocationField,
    ),
  };
}

/**
 * Build the "city › secondary" location label for a card, given the configured
 * secondary field, with fallback chain neighborhood → municipality → province.
 */
export function buildLocationLabel(
  loc: {
    city: string | null;
    neighborhood: string | null;
    municipality: string | null;
    province: string | null;
  },
  field: CardDisplayConfig["cardLocationField"],
): string {
  const byField: Record<CardDisplayConfig["cardLocationField"], string | null> = {
    neighborhood: loc.neighborhood,
    municipality: loc.municipality,
    province: loc.province,
  };
  const secondary =
    byField[field] || loc.neighborhood || loc.municipality || loc.province;
  return Array.from(new Set([loc.city, secondary].filter(Boolean))).join(", ");
}
