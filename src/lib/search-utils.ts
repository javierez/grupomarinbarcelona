import { normalizeForUrl } from "./utils";
import { normalizeProvince } from "./location-normalization";

export type PropertyType =
  | "piso"
  | "casa"
  | "local"
  | "solar"
  | "garaje"
  | "edificio"
  | "oficina"
  | "industrial"
  | "trastero"
  | "any";

export interface SearchParams {
  // Legacy single-value location (still populated by the parser for existing
  // consumers like page title rendering). New code should read `cities`.
  location?: string;
  // Multi-select city names (kebab/space tolerant — each element is stored as
  // a decoded human string like "Málaga" or "Nueva Andalucía").
  cities?: string[];
  // Multi-select neighborhood IDs (bigint IDs serialized as strings).
  neighborhoodIds?: string[];
  // Accepts a single value (legacy) or an array for multi-select.
  propertyType?: PropertyType | PropertyType[];
  bedrooms?: string;
  bathrooms?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  status?: "for-sale" | "for-rent" | "any";
  province?: string;
  municipality?: string;
  isOportunidad?: boolean;
}

// Normalize propertyType input to a deduped array of concrete types
// (drops "any" and undefined). Returns [] when the filter is "any".
export function normalizePropertyTypes(
  input: SearchParams["propertyType"],
): Exclude<PropertyType, "any">[] {
  if (!input) return [];
  const arr = Array.isArray(input) ? input : [input];
  const out = arr.filter(
    (t): t is Exclude<PropertyType, "any"> => !!t && t !== "any",
  );
  return Array.from(new Set(out));
}

// Convert search params to URL slug
export function buildSearchSlug(params: SearchParams): string {
  const segments: string[] = [];

  // Add property type and status
  let typeSegment = "";
  if (params.status === "for-rent") {
    typeSegment = "alquiler";
  } else if (params.status === "any") {
    // Neutral "all statuses" entry point. Used by the navbar free-text search,
    // which must find a reference whether it's a sale or a rental. Without this
    // "any" silently collapsed into "venta" and hid every rental.
    typeSegment = "todo";
  } else {
    typeSegment = "venta";
  }

  const typeToSlug: Record<Exclude<PropertyType, "any">, string> = {
    casa: "-casas",
    piso: "-pisos",
    local: "-locales",
    solar: "-solares",
    garaje: "-garajes",
    edificio: "-edificios",
    oficina: "-oficinas",
    industrial: "-naves-industriales",
    trastero: "-trasteros",
  };

  const types = normalizePropertyTypes(params.propertyType);
  if (types.length > 0) {
    // Sort by type key for a canonical URL regardless of selection order
    const sorted = [...types].sort();
    for (const t of sorted) {
      typeSegment += typeToSlug[t];
    }
  } else {
    typeSegment += "-propiedades";
  }

  segments.push(typeSegment);

  // Add location (cities) — multi-select capable
  const citiesList = params.cities && params.cities.length > 0
    ? params.cities
    : (params.location ? [params.location] : []);
  if (citiesList.length > 0) {
    const citySlugs = citiesList
      .map((c) => normalizeForUrl(c))
      .filter(Boolean);
    // Sort for a canonical URL regardless of click order.
    const canonical = Array.from(new Set(citySlugs)).sort().join(",");
    segments.push(`en-${canonical}`);
  } else {
    segments.push("todas-ubicaciones");
  }

  // Add neighborhood IDs as a dedicated segment
  if (params.neighborhoodIds && params.neighborhoodIds.length > 0) {
    const canonicalIds = Array.from(new Set(params.neighborhoodIds))
      .filter(Boolean)
      .sort();
    if (canonicalIds.length > 0) {
      segments.push(`barrios-${canonicalIds.join(",")}`);
    }
  }

  // Add province and municipality
  if (params.province && params.province !== "all") {
    segments.push(`provincia-${normalizeForUrl(params.province)}`);
  }
  if (params.municipality && params.municipality !== "all") {
    segments.push(`municipio-${params.municipality}`);
  }

  // Add filters
  const filters: string[] = [];

  if (params.minPrice) {
    filters.push(`precio-desde_${params.minPrice}`);
  }

  if (params.maxPrice) {
    filters.push(`precio-hasta_${params.maxPrice}`);
  }

  if (params.minArea) {
    filters.push(`metros-cuadrados-mas-de_${params.minArea}`);
  }

  if (params.maxArea) {
    filters.push(`metros-cuadrados-menos-de_${params.maxArea}`);
  }

  if (params.bedrooms && params.bedrooms !== "any") {
    const bedroomsNum = Number.parseInt(params.bedrooms);
    if (bedroomsNum === 1) {
      filters.push("un-dormitorio");
    } else if (bedroomsNum === 2) {
      filters.push("dos-dormitorios");
    } else if (bedroomsNum === 3) {
      filters.push("tres-dormitorios");
    } else if (bedroomsNum >= 4) {
      filters.push("cuatro-o-mas-dormitorios");
    }
  }

  if (params.bathrooms && params.bathrooms !== "any") {
    const bathroomsNum = Number.parseInt(params.bathrooms);
    if (bathroomsNum === 1) {
      filters.push("un-bano");
    } else if (bathroomsNum === 2) {
      filters.push("dos-banos");
    } else if (bathroomsNum >= 3) {
      filters.push("tres-o-mas-banos");
    }
  }

  // Add filters to URL if any exist
  if (filters.length > 0) {
    segments.push(`con-${filters.join(",")}`);
  }

  return segments.join("/");
}

// Parse URL slug to search params
export function parseSearchSlug(slug: string): SearchParams {
  const params: SearchParams = {};

  // Split the slug into segments
  const segments = slug.split("/").filter(Boolean);

  // Parse property type and status
  if (segments.length > 0) {
    const typeSegment = segments[0] ?? "";

    if (typeSegment.startsWith("alquiler")) {
      params.status = "for-rent";
    } else if (typeSegment.startsWith("todo")) {
      // "todo" / "todo-pisos" → every listing type. See buildSearchSlug.
      params.status = "any";
    } else {
      params.status = "for-sale";
    }

    const slugToType: Record<string, Exclude<PropertyType, "any">> = {
      "-casas": "casa",
      "-pisos": "piso",
      "-locales": "local",
      "-solares": "solar",
      "-garajes": "garaje",
      "-edificios": "edificio",
      "-oficinas": "oficina",
      "-naves-industriales": "industrial",
      "-trasteros": "trastero",
    };

    const matched: Exclude<PropertyType, "any">[] = [];
    let remaining = typeSegment;
    // Match longest slugs first so "-naves-industriales" doesn't get partially
    // shadowed if we later add overlapping keys.
    const orderedSlugs = Object.keys(slugToType).sort(
      (a, b) => b.length - a.length,
    );
    for (const slug of orderedSlugs) {
      if (remaining.includes(slug)) {
        const type = slugToType[slug]!;
        matched.push(type);
        remaining = remaining.split(slug).join("");
      }
    }
    if (matched.length > 0) {
      params.propertyType = matched;
    }
  }

  // Parse location (cities) — supports single legacy value or comma-separated list
  if (segments.length > 1 && segments[1] !== "todas-ubicaciones") {
    let locationSegment = segments[1] ?? "";
    // Remove 'en-' prefix if it exists
    if (locationSegment.startsWith("en-")) {
      locationSegment = locationSegment.substring(3);
    }
    // Check for special "oportunidad" filter
    if (locationSegment === "oportunidad") {
      params.isOportunidad = true;
    } else {
      // Decode percent-encoding FIRST so commas (encoded as %2C by some
      // routers) become literal `,` before we split. Otherwise the whole
      // list collapses into a single element ("astorga%2Cleon").
      const decodedSegment = (() => {
        try {
          return decodeURIComponent(locationSegment);
        } catch {
          return locationSegment;
        }
      })();
      const citySlugs = decodedSegment
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const cityNames = citySlugs.map((slug) => slug.replace(/-/g, " "));
      if (cityNames.length > 0) {
        params.cities = cityNames;
        // Keep legacy single-value `location` populated with the first city so
        // existing consumers (page title, breadcrumb) keep working.
        params.location = cityNames[0];
      }
    }
  }

  // Parse province, municipality, and neighborhood IDs
  for (let i = 2; i < segments.length; i++) {
    const segment = segments[i];
    if (segment?.startsWith("provincia-")) {
      params.province = normalizeProvince(segment.substring(10));
    } else if (segment?.startsWith("municipio-")) {
      params.municipality = segment.substring(10);
    } else if (segment?.startsWith("barrios-")) {
      const raw = segment.substring("barrios-".length);
      const decoded = (() => {
        try {
          return decodeURIComponent(raw);
        } catch {
          return raw;
        }
      })();
      const ids = decoded
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length > 0) {
        params.neighborhoodIds = ids;
      }
    }
  }

  // Parse filters
  const filtersSegment = segments.find((segment) =>
    segment?.startsWith("con-"),
  );
  if (filtersSegment) {
    const filtersString = filtersSegment.substring(4); // Remove 'con-'
    const filters = filtersString.split(",");

    filters.forEach((filter) => {
      if (filter.startsWith("precio-desde_")) {
        params.minPrice = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter.startsWith("precio-hasta_")) {
        params.maxPrice = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter.startsWith("metros-cuadrados-mas-de_")) {
        params.minArea = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter.startsWith("metros-cuadrados-menos-de_")) {
        params.maxArea = Number.parseInt(filter.split("_")[1] ?? "0");
      } else if (filter === "un-dormitorio") {
        params.bedrooms = "1";
      } else if (filter === "dos-dormitorios") {
        params.bedrooms = "2";
      } else if (filter === "tres-dormitorios") {
        params.bedrooms = "3";
      } else if (filter === "cuatro-o-mas-dormitorios") {
        params.bedrooms = "4";
      } else if (filter === "un-bano") {
        params.bathrooms = "1";
      } else if (filter === "dos-banos") {
        params.bathrooms = "2";
      } else if (filter === "tres-o-mas-banos") {
        params.bathrooms = "3";
      }
    });
  }

  return params;
}
