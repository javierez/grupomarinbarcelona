import { sql, eq, inArray, type SQL } from "drizzle-orm";
import { listings, properties } from "~/server/db/schema";

/**
 * The displayable surface, in SQL. Exported so result queries can also ORDER BY
 * it — the list must sort and filter on the number the card actually shows.
 * SQL twin of `resolveSquareMeter()` in ~/lib/surface; change both together.
 */
export const surfaceExpr = sql`CASE WHEN ${properties.propertyType} IN ('solar','terreno','parcela')
    THEN COALESCE(NULLIF(${properties.builtSurfaceArea}, 0), NULLIF(${properties.squareMeter}, 0))
    ELSE COALESCE(NULLIF(${properties.squareMeter}, 0), NULLIF(${properties.builtSurfaceArea}, 0))
  END`;

// Canonical SearchFilters type shared between result queries (listings.ts)
// and location-option queries (locations.ts) so they apply identical WHERE
// logic for everything except location itself.
export interface SearchFilters {
  // Legacy single-value location — used only when `cities` / `neighborhoodIds`
  // are absent (e.g. old bookmarked URLs).
  location?: string;
  // Multi-select city names (LIKE-matched per-city, OR'd together).
  cities?: string[];
  // Multi-select neighborhood IDs (serialized bigints).
  neighborhoodIds?: string[];
  // Single value (legacy) or array for multi-select
  propertyType?: string | string[];
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  status?: "for-sale" | "for-rent";
  isOportunidad?: boolean;
  isFeatured?: boolean;
  hasPromotion?: boolean;
  promotionId?: bigint | string;
  // Free-text query from the navbar "Busca" box. Matched against references,
  // address, location and title/description — see queries/text-search.ts.
  q?: string;
}

// Everything except location fields (cities / neighborhoodIds / location).
// Used by getProvinces / getCitiesAndNeighborhoodsByProvince so the dropdown
// only shows places that still have matching listings after other filters.
export type NonLocationFilters = Omit<
  SearchFilters,
  "cities" | "neighborhoodIds" | "location"
>;

export function buildNonLocationFilterConditions(
  filters?: NonLocationFilters,
): SQL[] {
  const conds: SQL[] = [];
  if (!filters) return conds;

  if (filters.propertyType) {
    const types = (
      Array.isArray(filters.propertyType)
        ? filters.propertyType
        : [filters.propertyType]
    ).filter((t): t is string => !!t && t !== "any");

    // "industrial" (Naves) is mostly stored as a Local with a "Nave industrial"
    // subtype rather than a top-level propertyType, so a plain
    // eq(propertyType, 'industrial') matches almost nothing. Match both the
    // (rare) top-level 'industrial' AND the (type=local AND subtype~nave) rows.
    const hasIndustrial = types.includes("industrial");

    const orParts: SQL[] = [];
    if (types.length === 1) {
      orParts.push(eq(properties.propertyType, types[0]!));
    } else if (types.length > 1) {
      orParts.push(inArray(properties.propertyType, types));
    }
    if (hasIndustrial) {
      orParts.push(
        sql`(${properties.propertyType} = 'local' AND LOWER(${properties.propertySubtype}) LIKE '%nave%')`,
      );
    }
    if (orParts.length === 1) {
      conds.push(orParts[0]!);
    } else if (orParts.length > 1) {
      conds.push(sql`(${sql.join(orParts, sql` OR `)})`);
    }
  }

  if (filters.status === "for-rent") {
    conds.push(sql`${listings.listingType} IN ('Rent', 'RentWithOption')`);
  } else if (filters.status === "for-sale") {
    conds.push(eq(listings.listingType, "Sale"));
  }

  if (filters.bedrooms && filters.bedrooms > 0) {
    conds.push(sql`${properties.bedrooms} >= ${filters.bedrooms}`);
  }

  if (filters.bathrooms && filters.bathrooms > 0) {
    conds.push(
      sql`CAST(${properties.bathrooms} AS DECIMAL) >= ${filters.bathrooms}`,
    );
  }

  if (filters.minPrice && filters.minPrice > 0) {
    conds.push(
      sql`CAST(${listings.price} AS DECIMAL) >= ${filters.minPrice}`,
    );
  }

  if (filters.maxPrice && filters.maxPrice > 0) {
    conds.push(
      sql`CAST(${listings.price} AS DECIMAL) <= ${filters.maxPrice}`,
    );
  }

  // Surface filter. MUST match `resolveSquareMeter()` in ~/lib/surface — the
  // list has to filter on the same number the card prints, or listings vanish
  // from results while still displaying a matching size.
  //
  // Two things the previous COALESCE got wrong:
  //   1. Land flips the columns: on solar/terreno/parcela the plot lives in
  //      built_surface_area, so filtering on square_meter compared against the
  //      BUILDABLE area (usually much smaller, often absent).
  //   2. COALESCE only skips NULL, not 0. A stored 0 means "unknown", and
  //      `0 >= 100` is false, so those rows were silently dropped.
  // NULLIF fixes (2); the CASE fixes (1).
  if (filters.minArea && filters.minArea > 0) {
    conds.push(sql`${surfaceExpr} >= ${filters.minArea}`);
  }

  if (filters.maxArea && filters.maxArea > 0) {
    conds.push(sql`${surfaceExpr} <= ${filters.maxArea}`);
  }

  if (filters.isOportunidad) {
    conds.push(eq(listings.isOpportunity, true));
  }

  if (filters.isFeatured) {
    conds.push(eq(listings.isFeatured, true));
  }

  if (filters.hasPromotion) {
    conds.push(sql`${listings.promotionId} IS NOT NULL`);
  }

  if (filters.promotionId !== undefined && filters.promotionId !== "") {
    const id =
      typeof filters.promotionId === "bigint"
        ? filters.promotionId
        : BigInt(filters.promotionId);
    conds.push(eq(listings.promotionId, id));
  }

  return conds;
}
