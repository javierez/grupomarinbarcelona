import { normalizeForUrl } from "./utils";

const MAX_SLUG_LENGTH = 70;

const PROPERTY_TYPE_DISPLAY: Record<string, string> = {
  piso: "Piso",
  apartamento: "Apartamento",
  casa: "Casa",
  chalet: "Chalet",
  local: "Local",
  solar: "Terreno",
  garaje: "Garaje",
  edificio: "Edificio",
  oficina: "Oficina",
  industrial: "Nave industrial",
  trastero: "Trastero",
};

export interface PropertyAltInput {
  title?: string | null;
  propertyType?: string | null;
  city?: string | null;
  bedrooms?: number | null;
  squareMeter?: number | null;
  listingType?: string | null;
}

/**
 * Builds descriptive SEO/accessibility-friendly alt text for property images.
 * Falls back gracefully when fields are missing.
 */
export function buildPropertyImageAlt(
  input: PropertyAltInput,
  index?: number,
): string {
  const typeKey = input.propertyType?.toLowerCase();
  const typeLabel = typeKey
    ? (PROPERTY_TYPE_DISPLAY[typeKey] ?? typeKey)
    : "Propiedad";

  const parts: string[] = [typeLabel];

  if (
    input.listingType === "Rent" ||
    input.listingType === "RentWithOption"
  ) {
    parts.push("en alquiler");
  } else if (input.listingType === "Sale") {
    parts.push("en venta");
  }

  if (input.city) parts.push(`en ${input.city}`);
  if (input.bedrooms && input.bedrooms > 0) {
    parts.push(
      `con ${input.bedrooms} ${input.bedrooms === 1 ? "habitación" : "habitaciones"}`,
    );
  }
  if (input.squareMeter && input.squareMeter > 0) {
    parts.push(`de ${input.squareMeter} m²`);
  }

  const base = input.title?.trim() || parts.join(" ");
  if (typeof index === "number" && index > 0) {
    return `${base} - Foto ${index + 1}`;
  }
  return base;
}

/** Title-case a free-text label ("ático dúplex" → "Ático Dúplex"). */
function titleCaseLabel(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export interface PropertyLocalityInput {
  neighborhood?: string | null;
  municipality?: string | null;
  city?: string | null;
}

/**
 * Resolves the most specific available locality for a listing:
 * neighborhood → municipality → city. Used for titles and map pins so the
 * label prefers the barrio, then the municipio, then the city.
 */
export function resolvePropertyLocality(
  input: PropertyLocalityInput,
): string | null {
  return (
    input.neighborhood?.trim() ||
    input.municipality?.trim() ||
    input.city?.trim() ||
    null
  );
}

export interface PropertyDisplayTitleInput extends PropertyLocalityInput {
  title?: string | null;
  propertyType?: string | null;
  propertySubtype?: string | null;
}

/**
 * Human-friendly display title for a listing. Uses the stored title when present,
 * otherwise composes one as "<subtype> en <locality>" (e.g. "Ático en Centro"),
 * falling back to the property type and then to "Propiedad". Guards against null
 * titles leaking into the browser tab / <h1> / breadcrumbs.
 */
export function buildPropertyDisplayTitle(
  input: PropertyDisplayTitleInput,
): string {
  const stored = input.title?.trim();
  if (stored) return stored;

  const typeLabel = resolvePropertyTypeLabel(input);
  const locality = resolvePropertyLocality(input);
  return locality ? `${typeLabel} en ${locality}` : typeLabel;
}

/** Display label for a property's type — subtype preferred, then the type map. */
function resolvePropertyTypeLabel(input: {
  propertyType?: string | null;
  propertySubtype?: string | null;
}): string {
  const subtype = input.propertySubtype?.trim();
  if (subtype) return titleCaseLabel(subtype);
  const typeKey = input.propertyType?.toLowerCase();
  return typeKey
    ? (PROPERTY_TYPE_DISPLAY[typeKey] ?? titleCaseLabel(typeKey))
    : "Propiedad";
}

/** Remove a leading/trailing street number from a street name. */
function stripStreetNumber(street: string): string {
  return street
    .replace(/,?\s*\d+[A-Za-z]?\s*$/g, "") // trailing number (", 5" / " 12B")
    .replace(/^\d+[A-Za-z]?\s*,?\s*/g, "") // leading number ("5, " / "12B ")
    .trim();
}

export type LocationVisibility = 1 | 2 | 3;

export interface VisibilityTitleInput {
  propertyType?: string | null;
  propertySubtype?: string | null;
  street?: string | null;
  municipality?: string | null;
  neighborhood?: string | null;
  subneighborhood?: string | null;
  city?: string | null;
  /** listings.visibility_mode: 1=Exact, 2=Street, 3=Zone. Defaults to 1. */
  visibilityMode?: number | null;
}

/**
 * Privacy-aware property title that adapts to the listing's location visibility:
 *   1 (Exact)  → "<Tipo> en <calle con número>"
 *   2 (Street) → "<Tipo> en <calle sin número>"
 *   3 (Zone)   → "<Tipo> en <municipio>, <sub-barrio | barrio>"
 * Each level falls back to the next-broadest locality when its field is empty,
 * so the title never exposes more than the configured visibility allows.
 */
export function buildVisibilityAwareTitle(input: VisibilityTitleInput): string {
  const typeLabel = resolvePropertyTypeLabel(input);
  const mode = input.visibilityMode ?? 1;

  const street = input.street?.trim();
  const municipality = input.municipality?.trim();
  // Finest barrio available (sub-neighborhood preferred over neighborhood).
  const zone = input.subneighborhood?.trim() || input.neighborhood?.trim();
  const zoneLocality =
    [municipality, zone].filter(Boolean).join(", ") ||
    municipality ||
    input.city?.trim() ||
    null;

  let locality: string | null;
  if (mode >= 3) {
    locality = zoneLocality;
  } else if (mode === 2) {
    locality = (street ? stripStreetNumber(street) : "") || zoneLocality;
  } else {
    locality = street ?? zoneLocality;
  }

  return locality ? `${typeLabel} en ${locality}` : typeLabel;
}

const PROPERTY_TYPE_SLUG: Record<string, string> = {
  piso: "piso",
  apartamento: "apartamento",
  casa: "casa",
  chalet: "chalet",
  local: "local",
  solar: "solar",
  garaje: "garaje",
  edificio: "edificio",
  oficina: "oficina",
  industrial: "nave-industrial",
  trastero: "trastero",
};

export interface PropertySlugInput {
  listingId: string | number | bigint;
  title?: string | null;
  propertyType?: string | null;
  city?: string | null;
  bedrooms?: number | null;
  listingType?: string | null;
}

/**
 * Builds a canonical, SEO-friendly slug for a property listing.
 * Format: "<type>-<bedrooms>-hab-<city>-<title>-<id>"
 * Trailing numeric id is the source of truth and what the page uses to resolve.
 */
export function buildPropertySlug(input: PropertySlugInput): string {
  const id = String(input.listingId);
  const parts: string[] = [];

  const typeKey = input.propertyType?.toLowerCase();
  const typeSlug = typeKey ? (PROPERTY_TYPE_SLUG[typeKey] ?? typeKey) : null;
  if (typeSlug) parts.push(typeSlug);

  if (input.bedrooms && input.bedrooms > 0) {
    parts.push(`${input.bedrooms}-hab`);
  }

  if (input.listingType === "Rent" || input.listingType === "RentWithOption") {
    parts.push("alquiler");
  }

  if (input.city) parts.push(input.city);
  if (input.title) parts.push(input.title);

  if (parts.length === 0) return id;

  const slugBody = parts
    .map((p) => normalizeForUrl(p))
    .filter(Boolean)
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slugBody ? `${slugBody}-${id}` : id;
}

/**
 * Extracts the numeric listing ID from the end of a property slug.
 * Accepts both legacy numeric-only slugs ("123") and descriptive ones
 * ("piso-3-hab-madrid-123"). Returns null if no valid trailing id.
 */
export function parsePropertySlug(
  slug: string,
): { id: number; raw: string } | null {
  const raw = decodeURIComponent(slug);
  const match = /(\d+)$/.exec(raw);
  if (!match) return null;
  const id = parseInt(match[1]!, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { id, raw };
}
