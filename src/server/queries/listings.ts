// Sin "use server": una query no es una acción. Con la directiva cada export
// era una acción, con los argumentos que quisiera quien llama:
// `getListingsForGrid` con la cuenta de otra agencia, `getPropertyImages`,
// `getPropertyMedia` y `getImagesForListings` con cualquier inmueble (también
// sin publicar, con las fotos originales), y los listados sin tope de `limit`.
// Lo que pide el navegador va por `~/server/actions/listings-navegador`.
import "server-only";

import { db } from "../db";
import {
  properties,
  listings,
  locations,
  users,
  propertyImages,
  websiteProperties,
} from "~/server/db/schema";
import { eq, and, desc, asc, sql, or, notInArray, inArray, type SQL } from "drizzle-orm";
import { cache } from "react";
import { env } from "~/env";
import { ciudadesActivas, provinciasActivas } from "./lugares-activos";
import {
  firstVideoUrl,
  hasAtLeastOnePhoto,
  reservadoCondition,
  visibleStatusCondition,
} from "./filters";
import { getFeaturesProps, getPropertiesConfig } from "./website-config";
import {
  buildNonLocationFilterConditions,
  surfaceExpr,
  type SearchFilters as BaseSearchFilters,
} from "./search-filters";
import {
  provinceSlug,
  toLocationSlug,
} from "~/lib/location-normalization";
import {
  RENT_LISTING_TYPES,
  SALE_LISTING_TYPES,
} from "~/lib/listing-types";
import { isNave } from "~/lib/property-rooms";
import { isSearchPropertyType } from "~/lib/search-utils";
import { toPublicCardLocation } from "~/lib/location-privacy";
import { resolveSquareMeter } from "~/lib/surface";
import {
  buildTextSearchCondition,
  buildExactReferenceCondition,
} from "./text-search";
import { getWatermarkConfig } from "./watermark";
import { buildWatermarkedUrl, cardImageColumns, cardImagesFor } from "./card-images";

const ACCOUNT_ID = 141n;

// La descripción que enseña la web: la del anuncio y, si está vacía, la del
// inmueble. Las cuentas importadas la tienen solo en `properties.description`
// (es la misma cascada que la ficha pública del CRM, `load-property.ts`); sin
// ella esos pisos salían sin texto en la tarjeta y en la ficha.
const publicDescription = sql<
  string | null
>`COALESCE(NULLIF(${listings.description}, ''), ${properties.description})`;

export type FeedImage = {
  propertyImageId: string;
  imageUrl: string;
  imageOrder: number;
  imageTag: string | null;
};

export type ListingCardData = {
  // Essential listing fields
  listingId: bigint;
  propertyId: bigint;
  price: string;
  // When true, the real price is present but the UI must blur it (fc_price_visibility).
  hidePrice: boolean;
  listingType: string;
  status: string;
  // Derived: on-market listing with a live (non-Lost) deal. Shown as a
  // secondary badge — never replaces the primary En Venta/En Alquiler status.
  reservado: boolean;
  isBankOwned: boolean | null;
  isOportunidad: boolean | null;
  agentName: string | null;
  // Agency's own portal reference (e.g. "DAC-2026-0001"). Shown as "Ref:" when
  // present; the UI falls back to the internal listingId when null/empty.
  idealistaReference: string | null;

  // Essential property fields
  title: string | null;
  description: string | null;
  propertyType: string | null;
  propertySubtype: string | null;
  bedrooms: number | null;
  bathrooms: string | null;
  squareMeter: number | null;
  builtSurfaceArea: string | null;
  street: string | null;

  // Location fields
  city: string | null;
  province: string | null;
  municipality: string | null;
  neighborhood: string | null;
  latitude: string | null;
  longitude: string | null;
  // 1=Exact, 2=Street (no number), 3=Zone — pin must be jittered when 2 or 3.
  fcLocationVisibility: number | null;
  // Visibilidad de la web; junto con la de portales decide la efectiva (ver
  // ~/lib/location-privacy), que es la que queda en fcLocationVisibility.
  visibilityMode?: number | null;

  // Image fields. Con marca de agua, la copia horneada; la original va en
  // `*Fallback` para que la tarjeta caiga a ella si la copia aún no existe.
  imageUrl: string | null;
  imageUrl2: string | null;
  imageUrlFallback?: string | null;
  imageUrl2Fallback?: string | null;
  /** «Destacado», lo marca la agencia. Opcional: banner y promos no lo piden. */
  isFeatured?: boolean | null;
  // First uploaded video, when the listing has one. Optional so the other
  // producers of this shape (banner, promo cards) needn't select it.
  videoUrl?: string | null;
};

// Canonical type lives in ./search-filters (so locations.ts can share the
// same shape). Re-exported here so existing consumers keep their import path.
export type SearchFilters = BaseSearchFilters;

// The URL encodes city names as accent-free slugs (`león` → `leon`) but the
// DB stores the raw "León" variant. Resolve slugs to the exact variants that
// live in `locations.city` so the query can use exact `IN (...)` matching
// instead of a brittle LIKE that fails on diacritics.
async function resolveCityVariants(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  // Por slug: `toLocationKey` conserva guiones y apóstrofos, así que
  // "Vitoria-Gasteiz" (BD) no casaba con "vitoria gasteiz" (URL).
  const keys = new Set(slugs.map(toLocationSlug));
  const matched = (await ciudadesActivas()).filter((city) =>
    keys.has(toLocationSlug(city)),
  );
  return Array.from(new Set(matched));
}

// Igual para la provincia: la URL trae el nombre canónico y la BD guarda
// grafías como "LEON", "León" o el alias "Bizkaia". Se comparan por slug
// canónico (alias resueltos) para poder usar `IN (...)`.
async function resolveProvinceVariants(province: string): Promise<string[]> {
  const key = provinceSlug(province);
  return (await provinciasActivas()).filter(
    (p): p is string => !!p && provinceSlug(p) === key,
  );
}

type ResolvedFilters = SearchFilters & { provinceVariants?: string[] };

async function resolveFilters(
  filters?: SearchFilters,
): Promise<ResolvedFilters | undefined> {
  if (!filters) return filters;
  const resolved: ResolvedFilters = { ...filters };
  if (filters.cities && filters.cities.length > 0) {
    resolved.cities = await resolveCityVariants(filters.cities);
  }
  if (filters.province) {
    resolved.provinceVariants = await resolveProvinceVariants(filters.province);
  }
  return resolved;
}

export type SortOption =
  | "default"
  | "newest"
  // `oldest` no existía aquí, pero el selector del CRM ofrece «Más antiguos
  // primero» (`date-asc`): sin este miembro la elección no tenía a dónde
  // traducirse y caía en `default`.
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "size-asc"
  | "size-desc";


/**
 * El ORDER BY de cualquier superficie que liste inmuebles. Único, para que el
 * orden que configura la agencia signifique lo mismo en el buscador y en la
 * portada — estaba escrito dos veces y ninguna de las dos miraba la
 * configuración.
 */
function buildSortOrder(
  sort: SortOption,
  {
    featuredFirst = false,
    typeFirst = false,
  }: { featuredFirst?: boolean; typeFirst?: boolean } = {},
): SQL[] {
  const byType = asc(sql`CASE
    WHEN ${properties.propertyType} IN ('casa', 'piso') THEN 0
    WHEN ${properties.propertyType} = 'local' THEN 1
    ELSE 2
  END`);
  const byPrice = desc(sql`CAST(${listings.price} AS DECIMAL)`);
  const primary = (): SQL[] => {
    switch (sort) {
      case "newest":
        return [desc(listings.createdAt)];
      case "oldest":
        return [asc(listings.createdAt)];
      case "price-asc":
        return [asc(sql`CAST(${listings.price} AS DECIMAL)`)];
      case "price-desc":
        return [desc(sql`CAST(${listings.price} AS DECIMAL)`)];
      // La superficie que enseña la tarjeta y que usa el filtro (en un solar,
      // la parcela). Con `square_meter` primero, un terreno de 5.000 m² salía
      // detrás de un piso de 90 en "Tamaño: mayor a menor".
      case "size-asc":
        return [asc(sql`COALESCE(${surfaceExpr}, 0)`)];
      case "size-desc":
        return [desc(sql`COALESCE(${surfaceExpr}, 0)`)];
      default:
        // "Destacados primero", como dice el menú: los destacados de cualquier
        // tipo delante, y luego agrupado por tipo (casa/piso, local, resto)
        // con precio descendente. Antes el tipo iba primero y una nave
        // destacada salía detrás de todos los pisos sin destacar.
        // `ordenPorTipo` (21, de la v1) deja el orden de antes: tipo primero.
        return typeFirst
          ? [byType, desc(listings.isFeatured), byPrice]
          : [desc(listings.isFeatured), byType, byPrice];
    }
  };
  return [
    // La portada antepone los destacados; el orden de la agencia manda dentro
    // de cada grupo. Sin esto, con `newest` o `price-*` la sección
    // «Propiedades destacadas» enseñaba los 12 más recientes, destacados o no.
    ...(featuredFirst ? [desc(listings.isFeatured)] : []),
    ...primary(),
    // Desempate estable. Ninguna de las ordenaciones de arriba es única —hay
    // anuncios con el mismo precio, la misma superficie o la misma fecha— y sin
    // este criterio Postgres puede devolverlos en distinto orden en cada
    // consulta: al paginar, una misma ficha sale en dos páginas y otra no sale
    // en ninguna.
    desc(listings.listingId),
  ];
}

async function buildWhereConditions(
  filters?: ResolvedFilters,
  accountIdArg?: bigint,
) {
  // Draft/Descartado nunca; Vendido/Alquilado solo dentro de la ventana de
  // escaparate que configura la agencia (`soldVisibilityDays`, 0 por defecto).
  // Regla única en filters.ts — estaba copiada aquí, en `getSitemapListings` y
  // en la query de los filtros (hoy search-options.ts), y contaba desde
  // `updatedAt`, que cualquier edición reinicia.
  const { soldVisibilityDays } = await getPropertiesConfig(accountIdArg);
  const whereConditions = [
    eq(listings.accountId, accountIdArg ?? ACCOUNT_ID),
    eq(listings.isActive, true),
    eq(listings.publishToWebsite, true),
    hasAtLeastOnePhoto(listings.propertyId),
    visibleStatusCondition(soldVisibilityDays),
  ];

  if (filters) {
    // Free-text search. Applied here (rather than at the call site) so that
    // `countListings` and `searchListings` — which both build their WHERE from
    // this function — stay in lockstep. Adding it via `searchListings`'
    // `extraPredicate` instead would desync the result count and pagination,
    // because `countListings` takes no such argument.
    if (filters.q) {
      const textCondition = buildTextSearchCondition(filters.q);
      if (textCondition) whereConditions.push(textCondition);
    }

    // Multi-select city + neighborhood filter: any match counts (OR semantics).
    const hasCities = !!filters.cities && filters.cities.length > 0;
    const hasNeighborhoods =
      !!filters.neighborhoodIds && filters.neighborhoodIds.length > 0;

    if (hasCities || hasNeighborhoods) {
      const locationClauses = [] as ReturnType<typeof sql>[];

      if (hasCities) {
        // `filters.cities` is expected to be pre-resolved into real DB-stored
        // variants (see `resolveCityVariants`). Exact match avoids the
        // diacritics / fuzzy-LIKE pitfalls that bit the slug-based approach.
        const variants = filters.cities!.filter((c) => !!c);
        if (variants.length > 0) {
          locationClauses.push(inArray(locations.city, variants));
        } else {
          // The user selected cities but resolution returned zero DB variants
          // — force-fail the query instead of silently dropping the filter
          // (which would return everything and surprise the user).
          locationClauses.push(sql`false`);
        }
      }

      if (hasNeighborhoods) {
        const ids = filters
          .neighborhoodIds!.map((raw) => {
            try {
              return BigInt(raw);
            } catch {
              return null;
            }
          })
          .filter((v): v is bigint => v !== null);
        if (ids.length > 0) {
          locationClauses.push(inArray(locations.neighborhoodId, ids));
        }
      }

      if (locationClauses.length > 0) {
        const combined = or(...locationClauses);
        if (combined) whereConditions.push(combined);
      }
    } else if (filters.location && filters.location !== "todas-ubicaciones") {
      // Legacy single-value fallback (old bookmarked URLs).
      const locationValue = filters.location.replace(/-/g, " ");
      whereConditions.push(
        sql`(
        LOWER(${locations.city}) LIKE ${`%${locationValue.toLowerCase()}%`} OR
        LOWER(${locations.province}) LIKE ${`%${locationValue.toLowerCase()}%`} OR
        LOWER(${properties.street}) LIKE ${`%${locationValue.toLowerCase()}%`}
      )`,
      );
    }

    // Provincia: AND con la ciudad/barrio que haya (una ciudad de otra
    // provincia da vacío, que es lo correcto). Sin variantes en BD se fuerza el
    // vacío en vez de ignorar el filtro.
    if (filters.province) {
      const variants = filters.provinceVariants ?? [];
      whereConditions.push(
        variants.length > 0 ? inArray(locations.province, variants) : sql`false`,
      );
    }

    // Everything that isn't location: propertyType, status, bedrooms,
    // bathrooms, price, area, isOportunidad — shared with the location-option
    // queries in locations.ts so the dropdown narrows with them.
    whereConditions.push(...buildNonLocationFilterConditions(filters));
  }

  return whereConditions;
}

/**
 * Resolve a free-text query that looks like a reference to a single listing.
 *
 * Powers the navbar shortcut: pasting the "Ref." printed on a card jumps
 * straight to that property instead of showing a one-result grid. Returns null
 * unless EXACTLY one listing matches — an ambiguous reference falls through to
 * normal search results rather than guessing.
 *
 * Uses the same public gates as every other query here (account, active,
 * publishToWebsite, at least one photo), so an unpublished or photo-less
 * listing stays unreachable by reference.
 */
export const findListingByExactReference = cache(
  async (rawQuery: string): Promise<string | null> => {
    const refCondition = buildExactReferenceCondition(rawQuery);
    if (!refCondition) return null;

    try {
      const rows = await db
        .select({ listingId: listings.listingId })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .where(and(...(await buildWhereConditions()), refCondition))
        // Fetch 2: anything more than one match is ambiguous, so we bail.
        .limit(2);

      if (rows.length !== 1) return null;
      return rows[0]!.listingId.toString();
    } catch (error) {
      console.error("Error resolving listing by reference:", error);
      return null;
    }
  },
);

/**
 * Cuenta los anuncios que verían en total los visitantes.
 *
 * `extraPredicate` es el mismo parámetro que acepta `searchListings` y existe
 * precisamente para que las dos consultas puedan paginar el mismo conjunto:
 * las colecciones (`/coleccion/[slug]`) filtran con un predicado del DSL que no
 * cabe en `SearchFilters`, y sin este argumento el total no coincidiría con las
 * tarjetas mostradas. Si añades un filtro aquí, añádelo también allí.
 */
export const countListings = cache(
  async (filters?: SearchFilters, extraPredicate?: SQL): Promise<number> => {
    try {
      const resolved = await resolveFilters(filters);
      const whereConditions = await buildWhereConditions(resolved);
      if (extraPredicate) whereConditions.push(extraPredicate);

      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .where(and(...whereConditions));

      return Number(result[0]?.count ?? 0);
    } catch (error) {
      console.error("Error counting listings:", error);
      return 0;
    }
  },
);

/**
 * The "Ver en vídeo" banner in one round trip: how many listings of this search
 * have a video, plus a few cover photos. `COUNT(*) OVER ()` is evaluated before
 * LIMIT, so the count covers the whole search, not just the posters returned.
 */
export const getVideoTeaser = cache(
  async (
    filters: SearchFilters | undefined,
    posterLimit = 4,
  ): Promise<{ count: number; posters: string[] }> => {
    try {
      const resolved = await resolveFilters({ ...filters, hasVideo: true });
      const whereConditions = await buildWhereConditions(resolved);

      const rows = await db
        .select({
          total: sql<number>`COUNT(*) OVER ()`,
          poster: sql<string | null>`(
            SELECT COALESCE(med_url, full_url, image_url)
            FROM property_images
            WHERE property_id = ${properties.propertyId}
              AND is_active = true
              AND (image_tag IS NULL OR image_tag NOT IN ('tour', 'youtube', 'video', 'plano'))
            ORDER BY image_order ASC
            LIMIT 1
          )`,
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .where(and(...whereConditions))
        .limit(posterLimit);

      return {
        count: Number(rows[0]?.total ?? 0),
        posters: rows.map((r) => r.poster).filter((u): u is string => !!u),
      };
    } catch (error) {
      console.error("Error fetching video teaser:", error);
      return { count: 0, posters: [] };
    }
  },
);

export const searchListings = cache(
  async (
    filters?: SearchFilters,
    limit = 24,
    // `undefined` = "sin elección explícita del visitante": cae en el orden que
    // la agencia haya configurado. El default vive en la config, no en esta
    // firma, para que no haya dos fuentes de verdad.
    sort?: SortOption,
    offset = 0,
    extraPredicate?: SQL,
    // La vista previa del CRM pinta otra cuenta que la del despliegue.
    accountIdArg?: bigint,
  ): Promise<ListingCardData[]> => {
    try {
      const resolved = await resolveFilters(filters);
      const whereConditions = await buildWhereConditions(resolved, accountIdArg);
      if (extraPredicate) whereConditions.push(extraPredicate);

      const [effectiveSort, watermark, features] = await Promise.all([
        sort ?? getPropertiesConfig(accountIdArg).then((c) => c.defaultSort),
        getWatermarkConfig(accountIdArg),
        getFeaturesProps(accountIdArg),
      ]);

      const listingsData = await db
        .select({
          // Essential listing fields
          listingId: listings.listingId,
          propertyId: listings.propertyId,
          accountId: listings.accountId,
          price: listings.price,
          listingType: listings.listingType,
          status: listings.status,
          // true = price hidden → the public site blurs it.
          fcPriceVisibility: listings.fcPriceVisibility,
          // Derived "Reservado": only a live reservation (see filters.ts).
          reservado: reservadoCondition(listings.status, listings.listingId),
          isBankOwned: listings.isBankOwned,
          isOportunidad: listings.isOpportunity,
          isFeatured: listings.isFeatured,
          idealistaReference: listings.idealistaReference,

          // Essential property fields
          // Listing's publishableTitle overrides property title when set.
          title: sql<string | null>`COALESCE(${listings.publishableTitle}, ${properties.title})`,
          description: publicDescription,
          propertyType: properties.propertyType,
          propertySubtype: properties.propertySubtype,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          squareMeter: properties.squareMeter,
          builtSurfaceArea: properties.builtSurfaceArea,
          street: properties.street,

          // Location fields
          city: locations.city,
          province: locations.province,
          municipality: locations.municipality,
          neighborhood: locations.neighborhood,
          latitude: properties.latitude,
          longitude: properties.longitude,
          fcLocationVisibility: listings.fcLocationVisibility,
          visibilityMode: listings.visibilityMode,

          // Agent name
          agentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,

          // Portada y foto del hover, planos al final (ver card-images.ts).
          ...cardImageColumns(properties.propertyId),
          videoUrl: firstVideoUrl(properties.propertyId),
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .leftJoin(users, eq(listings.agentId, users.id))
        .where(and(...whereConditions))
        .orderBy(
          ...buildSortOrder(effectiveSort, {
            typeFirst: features.ordenPorTipo === true,
          }),
        )
        .limit(limit)
        .offset(offset);

      // Transform the data. La calle y las coordenadas salen ya recortadas
      // según la visibilidad del anuncio (ver ~/lib/location-privacy): esto
      // viaja al navegador entero, lo pinte la tarjeta o no.
      return listingsData.map((listing) => toPublicCardLocation({
        listingId: listing.listingId,
        propertyId: listing.propertyId,
        price: listing.price?.toString() || "0",
        // Real price kept; the card blurs it when this is set.
        hidePrice: !!listing.fcPriceVisibility,
        listingType: listing.listingType,
        status: listing.status,
        reservado: !!listing.reservado,
        isBankOwned: listing.isBankOwned,
        isOportunidad: listing.isOportunidad,
        isFeatured: listing.isFeatured,
        agentName: listing.agentName,
        idealistaReference: listing.idealistaReference,
        title: listing.title,
        description: listing.description,
        propertyType: listing.propertyType,
        propertySubtype: listing.propertySubtype,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms?.toString() || null,
        squareMeter: resolveSquareMeter(
          listing.propertyType,
          listing.squareMeter,
          listing.builtSurfaceArea,
        ),
        builtSurfaceArea: listing.builtSurfaceArea?.toString() || null,
        street: listing.street,
        city: listing.city,
        province: listing.province,
        municipality: listing.municipality,
        neighborhood: listing.neighborhood,
        latitude: listing.latitude?.toString() ?? null,
        longitude: listing.longitude?.toString() ?? null,
        fcLocationVisibility: listing.fcLocationVisibility ?? null,
        visibilityMode: listing.visibilityMode ?? null,
        ...cardImagesFor(listing, listing.accountId, watermark.enabled),
        videoUrl: listing.videoUrl ?? null,
      }));
    } catch (error) {
      console.error("Error searching listings:", error);
      return [];
    }
  },
);

export const getListingsForGrid = cache(
  async (limit = 12, accountIdArg?: bigint): Promise<ListingCardData[]> => {
    try {
      const [{ soldVisibilityDays, defaultSort }, watermark, features] = await Promise.all([
        getPropertiesConfig(accountIdArg),
        getWatermarkConfig(accountIdArg),
        getFeaturesProps(accountIdArg),
      ]);
      // `ordenPorTipo` (21, de la v1): también en la portada, pisos y casas
      // primero, como su web de hoy; sin destacados por delante del tipo.
      const typeFirst = features.ordenPorTipo === true;
      // Simplified query with subqueries for images
      const listingsData = await db
        .select({
          // Essential listing fields
          listingId: listings.listingId,
          propertyId: listings.propertyId,
          price: listings.price,
          listingType: listings.listingType,
          status: listings.status,
          // true = price hidden → the public site blurs it.
          fcPriceVisibility: listings.fcPriceVisibility,
          // Derived "Reservado": only a live reservation (see filters.ts).
          reservado: reservadoCondition(listings.status, listings.listingId),
          isBankOwned: listings.isBankOwned,
          isOportunidad: listings.isOpportunity,
          isFeatured: listings.isFeatured,
          idealistaReference: listings.idealistaReference,

          // Essential property fields
          // Listing's publishableTitle overrides property title when set.
          title: sql<string | null>`COALESCE(${listings.publishableTitle}, ${properties.title})`,
          description: publicDescription,
          propertyType: properties.propertyType,
          propertySubtype: properties.propertySubtype,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          squareMeter: properties.squareMeter,
          builtSurfaceArea: properties.builtSurfaceArea,
          street: properties.street,

          // Location fields
          city: locations.city,
          province: locations.province,
          municipality: locations.municipality,
          neighborhood: locations.neighborhood,
          latitude: properties.latitude,
          longitude: properties.longitude,
          fcLocationVisibility: listings.fcLocationVisibility,
          visibilityMode: listings.visibilityMode,

          // Agent name
          agentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,

          // Portada y foto del hover, planos al final (ver card-images.ts).
          ...cardImageColumns(properties.propertyId),
          videoUrl: firstVideoUrl(properties.propertyId),
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .leftJoin(users, eq(listings.agentId, users.id))
        .where(
          and(
            eq(listings.accountId, accountIdArg ?? ACCOUNT_ID),
            eq(listings.isActive, true),
            eq(listings.publishToWebsite, true),
            hasAtLeastOnePhoto(listings.propertyId),
            // Viviendas, más lo que la agencia marque como destacado sea del
            // tipo que sea: sin esto una nave o un local destacado no salía
            // nunca en la portada.
            or(
              inArray(properties.propertyType, ["casa", "piso"]),
              eq(listings.isFeatured, true),
            ),
            visibleStatusCondition(soldVisibilityDays),
          ),
        )
        .orderBy(...buildSortOrder(defaultSort, { featuredFirst: !typeFirst, typeFirst }))
        .limit(limit);

      // Transform the data. La calle y las coordenadas salen ya recortadas
      // según la visibilidad del anuncio (ver ~/lib/location-privacy): esto
      // viaja al navegador entero, lo pinte la tarjeta o no.
      return listingsData.map((listing) => toPublicCardLocation({
        listingId: listing.listingId,
        propertyId: listing.propertyId,
        price: listing.price?.toString() || "0",
        // Real price kept; the card blurs it when this is set.
        hidePrice: !!listing.fcPriceVisibility,
        listingType: listing.listingType,
        status: listing.status,
        reservado: !!listing.reservado,
        isBankOwned: listing.isBankOwned,
        isOportunidad: listing.isOportunidad,
        isFeatured: listing.isFeatured,
        agentName: listing.agentName,
        idealistaReference: listing.idealistaReference,
        title: listing.title,
        description: listing.description,
        propertyType: listing.propertyType,
        propertySubtype: listing.propertySubtype,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms?.toString() || null,
        squareMeter: resolveSquareMeter(
          listing.propertyType,
          listing.squareMeter,
          listing.builtSurfaceArea,
        ),
        builtSurfaceArea: listing.builtSurfaceArea?.toString() || null,
        street: listing.street,
        city: listing.city,
        province: listing.province,
        municipality: listing.municipality,
        neighborhood: listing.neighborhood,
        latitude: listing.latitude?.toString() ?? null,
        longitude: listing.longitude?.toString() ?? null,
        fcLocationVisibility: listing.fcLocationVisibility ?? null,
        visibilityMode: listing.visibilityMode ?? null,
        ...cardImagesFor(listing, accountIdArg ?? ACCOUNT_ID, watermark.enabled),
        videoUrl: listing.videoUrl ?? null,
      }));
    } catch (error) {
      console.error("Error fetching listings:", error);
      return [];
    }
  },
);

// Get detailed listing information including all related data
export const getListingDetails = cache(
  async (listingId: number): Promise<any> => {
    try {
      const ACCOUNT_ID = 141n;
      const { soldVisibilityDays } = await getPropertiesConfig();

      const [listingDetails] = await db
        .select({
          // Listing fields
          listingId: listings.listingId,
          propertyId: listings.propertyId,
          idealistaReference: listings.idealistaReference,
          agentId: listings.agentId,
          listingType: listings.listingType,
          price: listings.price,
          status: listings.status,
          // true = price hidden → the public site blurs it.
          fcPriceVisibility: listings.fcPriceVisibility,
          // Derived "Reservado": only a live reservation (see filters.ts).
          reservado: reservadoCondition(listings.status, listings.listingId),
          isFurnished: listings.isFurnished,
          furnitureQuality: listings.furnitureQuality,
          optionalGarage: listings.optionalGarage,
          optionalGaragePrice: listings.optionalGaragePrice,
          optionalStorageRoom: listings.optionalStorageRoom,
          optionalStorageRoomPrice: listings.optionalStorageRoomPrice,
          hasKeys: listings.hasKeys,
          studentFriendly: listings.studentFriendly,
          petsAllowed: listings.petsAllowed,
          appliancesIncluded: listings.appliancesIncluded,
          internet: listings.internet,
          oven: listings.oven,
          microwave: listings.microwave,
          washingMachine: listings.washingMachine,
          fridge: listings.fridge,
          tv: listings.tv,
          stoneware: listings.stoneware,
          fotocasa: listings.fotocasa,
          fcLocationVisibility: listings.fcLocationVisibility,
          idealista: listings.idealista,
          habitaclia: listings.habitaclia,
          pisoscom: listings.pisoscom,
          yaencontre: listings.yaencontre,
          milanuncios: listings.milanuncios,
          isFeatured: listings.isFeatured,
          isBankOwned: listings.isBankOwned,
          visibilityMode: listings.visibilityMode,
          isActive: listings.isActive,
          viewCount: listings.viewCount,
          inquiryCount: listings.inquiryCount,
          createdAt: listings.createdAt,
          updatedAt: listings.updatedAt,

          // Property fields
          // Listing's publishableTitle overrides property title when set.
          title: sql<string | null>`COALESCE(${listings.publishableTitle}, ${properties.title})`,
          description: publicDescription,
          propertyType: properties.propertyType,
          propertySubtype: properties.propertySubtype,
          bedrooms: properties.bedrooms,
          bathrooms: properties.bathrooms,
          squareMeter: properties.squareMeter,
          yearBuilt: properties.yearBuilt,
          cadastralReference: properties.cadastralReference,
          builtSurfaceArea: properties.builtSurfaceArea,
          street: properties.street,
          addressDetails: properties.addressDetails,
          postalCode: properties.postalCode,
          neighborhoodId: properties.neighborhoodId,
          latitude: properties.latitude,
          longitude: properties.longitude,
          energyCertification: properties.energyCertification,
          energyCertificateStatus: properties.energyCertificateStatus,
          energyConsumptionScale: properties.energyConsumptionScale,
          energyConsumptionValue: properties.energyConsumptionValue,
          emissionsScale: properties.emissionsScale,
          emissionsValue: properties.emissionsValue,
          hasHeating: properties.hasHeating,
          heatingType: properties.heatingType,
          hasElevator: properties.hasElevator,
          hasGarage: properties.hasGarage,
          hasStorageRoom: properties.hasStorageRoom,
          garageType: properties.garageType,
          garageSpaces: properties.garageSpaces,
          garageInBuilding: properties.garageInBuilding,
          elevatorToGarage: properties.elevatorToGarage,
          garageNumber: properties.garageNumber,
          disabledAccessible: properties.disabledAccessible,
          vpo: properties.vpo,
          videoIntercom: properties.videoIntercom,
          conciergeService: properties.conciergeService,
          securityGuard: properties.securityGuard,
          satelliteDish: properties.satelliteDish,
          doubleGlazing: properties.doubleGlazing,
          alarm: properties.alarm,
          securityDoor: properties.securityDoor,
          newConstruction: properties.newConstruction,
          underConstruction: properties.underConstruction,
          lastRenovationYear: properties.lastRenovationYear,
          kitchenType: properties.kitchenType,
          hotWaterType: properties.hotWaterType,
          openKitchen: properties.openKitchen,
          frenchKitchen: properties.frenchKitchen,
          furnishedKitchen: properties.furnishedKitchen,
          pantry: properties.pantry,
          storageRoomSize: properties.storageRoomSize,
          storageRoomNumber: properties.storageRoomNumber,
          terrace: properties.terrace,
          terraceSize: properties.terraceSize,
          wineCellar: properties.wineCellar,
          wineCellarSize: properties.wineCellarSize,
          livingRoomSize: properties.livingRoomSize,
          balconyCount: properties.balconyCount,
          galleryCount: properties.galleryCount,
          buildingFloors: properties.buildingFloors,
          builtInWardrobes: properties.builtInWardrobes,
          mainFloorType: properties.mainFloorType,
          shutterType: properties.shutterType,
          carpentryType: properties.carpentryType,
          orientation: properties.orientation,
          airConditioningType: properties.airConditioningType,
          // Acondicionamiento del local. Tri-estado: NULL = no consta.
          isFittedOut: properties.isFittedOut,
          windowType: properties.windowType,
          exterior: properties.exterior,
          bright: properties.bright,
          views: properties.views,
          mountainViews: properties.mountainViews,
          seaViews: properties.seaViews,
          beachfront: properties.beachfront,
          jacuzzi: properties.jacuzzi,
          hydromassage: properties.hydromassage,
          garden: properties.garden,
          pool: properties.pool,
          homeAutomation: properties.homeAutomation,
          musicSystem: properties.musicSystem,
          laundryRoom: properties.laundryRoom,
          coveredClothesline: properties.coveredClothesline,
          fireplace: properties.fireplace,
          gym: properties.gym,
          sportsArea: properties.sportsArea,
          childrenArea: properties.childrenArea,
          suiteBathroom: properties.suiteBathroom,
          nearbyPublicTransport: properties.nearbyPublicTransport,
          communityPool: properties.communityPool,
          privatePool: properties.privatePool,
          tennisCourt: properties.tennisCourt,
          conservationStatus: properties.conservationStatus,

          // Location fields
          city: locations.city,
          province: locations.province,
          municipality: locations.municipality,
          neighborhood: locations.neighborhood,
          subneighborhood: locations.subneighborhood,

          // Agent information
          agentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          agentEmail: users.email,
          agentPhone: users.phone,
          agentImage: users.image,
          // Account vs agent contact toggle (Vesta "Cuenta"/"Agente"). When
          // false, the listing publishes the agency's contact data, not the
          // agent's — the public card mirrors that choice.
          useAgentPhone: listings.useAgentPhone,

          // Sin el nombre del propietario: nada de la web lo pinta, y este
          // objeto viaja entero a componentes de cliente, así que acababa en
          // el código fuente de la ficha pública.

          // First image only (we'll fetch all images separately if needed)
          firstImageUrl: sql<string>`(
          SELECT image_url 
          FROM property_images 
          WHERE property_id = ${properties.propertyId} 
            AND is_active = true 
            AND (image_tag IS NULL OR image_tag NOT IN ('tour', 'youtube', 'video'))
          ORDER BY (image_tag IS NOT DISTINCT FROM 'plano') ASC, image_order ASC
          LIMIT 1
        )`,
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .leftJoin(users, eq(listings.agentId, users.id))
        .where(
          and(
            eq(listings.listingId, BigInt(listingId)),
            eq(listings.accountId, ACCOUNT_ID),
            eq(listings.isActive, true),
            eq(listings.publishToWebsite, true),
            hasAtLeastOnePhoto(listings.propertyId),
            // La ficha NO tenía filtro de estado: un vendido conservaba su
            // página para siempre aunque desapareciera de los listados. Ahora
            // usa exactamente la misma regla que el listado, así que caduca a
            // la vez.
            visibleStatusCondition(soldVisibilityDays),
          ),
        );

      if (!listingDetails) {
        throw new Error("Listing not found");
      }


      // Convert BigInt values to strings to avoid serialization issues
      const serializedDetails = {
        ...listingDetails,
        // Real price kept; the detail page blurs it when this is set.
        hidePrice: !!listingDetails.fcPriceVisibility,
        // Keep the real status; expose reserved as a separate secondary flag.
        reservado: !!listingDetails.reservado,
        squareMeter: resolveSquareMeter(
          listingDetails.propertyType,
          listingDetails.squareMeter,
          listingDetails.builtSurfaceArea,
        ),
        listingId: listingDetails.listingId.toString(),
        propertyId: listingDetails.propertyId.toString(),
        neighborhoodId: listingDetails.neighborhoodId
          ? listingDetails.neighborhoodId.toString()
          : null,
      };

      return serializedDetails;
    } catch (error) {
      console.error("Error fetching listing details:", error);
      throw error;
    }
  },
);

// Lightweight query for sitemap generation — active published listings only.
// Includes the fields needed to build SEO-friendly slugs (see lib/property-slug.ts).
export const getAllListingSitemapData = cache(
  async (): Promise<
    {
      listingId: string;
      updatedAt: Date | null;
      title: string | null;
      propertyType: string | null;
      propertySubtype: string | null;
      city: string | null;
      bedrooms: number | null;
      listingType: string | null;
    }[]
  > => {
    try {
      const rows = await db
        .select({
          listingId: listings.listingId,
          updatedAt: listings.updatedAt,
          listingType: listings.listingType,
          // Listing's publishableTitle overrides property title when set.
          title: sql<string | null>`COALESCE(${listings.publishableTitle}, ${properties.title})`,
          propertyType: properties.propertyType,
          propertySubtype: properties.propertySubtype,
          bedrooms: properties.bedrooms,
          city: locations.city,
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .where(
          and(
            eq(listings.accountId, ACCOUNT_ID),
            eq(listings.isActive, true),
            eq(listings.publishToWebsite, true),
            hasAtLeastOnePhoto(listings.propertyId),
            // La misma puerta que la ficha: sin ella el sitemap anunciaba
            // vendidos y alquilados que al abrirlos daban 404.
            visibleStatusCondition(
              (await getPropertiesConfig()).soldVisibilityDays,
            ),
          ),
        );

      return rows.map((row) => ({
        listingId: row.listingId.toString(),
        updatedAt: row.updatedAt,
        title: row.title,
        propertyType: row.propertyType,
        propertySubtype: row.propertySubtype,
        city: row.city,
        bedrooms: row.bedrooms,
        listingType: row.listingType,
      }));
    } catch (error) {
      console.error("Error fetching listing sitemap data:", error);
      return [];
    }
  },
);

// Returns distinct (propertyType, city, listingType) tuples for search landing pages
export const getDistinctSearchCombinations = cache(
  async (): Promise<
    { propertyType: string; city: string; status: "for-sale" | "for-rent" }[]
  > => {
    try {
      const rows = await db
        .selectDistinct({
          propertyType: properties.propertyType,
          propertySubtype: properties.propertySubtype,
          city: locations.city,
          listingType: listings.listingType,
        })
        .from(listings)
        .innerJoin(properties, eq(listings.propertyId, properties.propertyId))
        .leftJoin(
          locations,
          eq(properties.neighborhoodId, locations.neighborhoodId),
        )
        .where(
          and(
            eq(listings.accountId, ACCOUNT_ID),
            eq(listings.isActive, true),
            eq(listings.publishToWebsite, true),
            hasAtLeastOnePhoto(listings.propertyId),
            // La misma puerta que la ficha: sin ella el sitemap anunciaba
            // vendidos y alquilados que al abrirlos daban 404.
            visibleStatusCondition(
              (await getPropertiesConfig()).soldVisibilityDays,
            ),
          ),
        );

      const results: {
        propertyType: string;
        city: string;
        status: "for-sale" | "for-rent";
      }[] = [];

      for (const row of rows) {
        if (!row.propertyType || !row.city) continue;

        // Mismo reparto Comprar/Alquilar que la búsqueda (~/lib/listing-types).
        let status: "for-sale" | "for-rent";
        const listingType = row.listingType ?? "";
        if ((SALE_LISTING_TYPES as readonly string[]).includes(listingType)) {
          status = "for-sale";
        } else if (
          (RENT_LISTING_TYPES as readonly string[]).includes(listingType)
        ) {
          status = "for-rent";
        } else {
          continue;
        }

        // Una nave guardada como local va a /…-naves-industriales/…, no a
        // /…-locales/…: el tipo "Local" del buscador no incluye naves.
        const propertyType = isNave(row.propertyType, row.propertySubtype)
          ? "industrial"
          : row.propertyType;
        // Un tipo heredado sin página propia generaba "/ventaundefined/…".
        if (!isSearchPropertyType(propertyType)) continue;

        results.push({ propertyType, city: row.city, status });
      }

      return results;
    } catch (error) {
      console.error("Error fetching distinct search combinations:", error);
      return [];
    }
  },
);

// Get all images for a property
export const getPropertyImages = cache(
  async (propertyId: string): Promise<any[]> => {
    try {
      const images = await db
        .select({
          propertyImageId: propertyImages.propertyImageId,
          imageUrl: propertyImages.imageUrl,
          thumbUrl: propertyImages.thumbUrl,
          medUrl: propertyImages.medUrl,
          fullUrl: propertyImages.fullUrl,
          s3key: propertyImages.s3key,
          imageOrder: propertyImages.imageOrder,
          imageTag: propertyImages.imageTag,
          originImageId: propertyImages.originImageId,
        })
        .from(propertyImages)
        .where(
          and(
            eq(propertyImages.propertyId, BigInt(propertyId)),
            eq(propertyImages.isActive, true),
            sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('tour', 'youtube', 'video'))`,
          ),
        )
        .orderBy(propertyImages.imageOrder);

      // Resolve watermark context: find a published listing for this property
      // and check the account + listing watermark enabled flags.
      let useWatermarked = false;
      let resolvedAccountId: string | null = null;

      try {
        const [listingCtx] = await db
          .select({
            accountId: listings.accountId,
            listingWmProps: sql<string | null>`"listings"."watermark_props"`,
            accountWmProps: websiteProperties.watermarkProps,
          })
          .from(listings)
          .leftJoin(
            websiteProperties,
            eq(websiteProperties.accountId, listings.accountId),
          )
          .where(
            and(
              eq(listings.propertyId, BigInt(propertyId)),
              eq(listings.publishToWebsite, true),
              eq(listings.isActive, true),
            ),
          )
          .limit(1);

        if (listingCtx) {
          resolvedAccountId = listingCtx.accountId.toString();

          // Parse watermark config JSON (account-level is text, listing-level is jsonb)
          let accountWm: { enabled?: boolean } = {};
          let listingWm: { enabled?: boolean } | null = null;

          try {
            accountWm =
              typeof listingCtx.accountWmProps === "string"
                ? JSON.parse(listingCtx.accountWmProps)
                : (listingCtx.accountWmProps ?? {});
          } catch {
            accountWm = {};
          }

          try {
            listingWm =
              typeof listingCtx.listingWmProps === "string"
                ? JSON.parse(listingCtx.listingWmProps)
                : (listingCtx.listingWmProps as { enabled?: boolean } | null);
          } catch {
            listingWm = null;
          }

          // Resolution chain: listing override → account default → false
          // See ~/Desktop/vesta/src/server/utils/apply-watermarks.ts:47-52
          const effectiveEnabled =
            listingWm?.enabled ?? accountWm?.enabled ?? false;

          useWatermarked = effectiveEnabled;
        }
      } catch (err) {
        console.warn(
          "[getPropertyImages] Failed to resolve watermark context, using originals:",
          err,
        );
      }

      // Convert BigInt to string and optionally rewrite URLs to watermarked S3 paths.
      // Always preserve the original URL so the client can fall back if the
      // watermarked file doesn't exist in S3 (e.g. cache never warmed).
      return images.map((img) => {
        const originalImageUrl = img.imageUrl;
        let imageUrl = originalImageUrl;

        if (useWatermarked && resolvedAccountId) {
          const wmUrl = buildWatermarkedUrl(
            resolvedAccountId,
            propertyId,
            img.imageOrder,
          );
          if (wmUrl) {
            imageUrl = wmUrl;
          } else if (!env.S3_CONSOLIDATED_BUCKET && !env.AWS_S3_BUCKET) {
            console.warn(
              "[getPropertyImages] S3_CONSOLIDATED_BUCKET and AWS_S3_BUCKET not set — falling back to original images",
            );
          }
        }

        return {
          ...img,
          imageUrl,
          originalImageUrl,
          propertyImageId: img.propertyImageId.toString(),
          originImageId: img.originImageId?.toString() ?? null,
        };
      });
    } catch (error) {
      console.error("Error fetching property images:", error);
      return [];
    }
  },
);

// Get media (videos, youtube links, virtual tours) for a property
export const getPropertyMedia = cache(
  async (
    propertyId: string,
  ): Promise<{
    videos: { id: string; url: string }[];
    youtubeLinks: { id: string; url: string }[];
    virtualTours: { id: string; url: string }[];
  }> => {
    try {
      const media = await db
        .select({
          propertyImageId: propertyImages.propertyImageId,
          imageUrl: propertyImages.imageUrl,
          imageTag: propertyImages.imageTag,
          imageOrder: propertyImages.imageOrder,
        })
        .from(propertyImages)
        .where(
          and(
            eq(propertyImages.propertyId, BigInt(propertyId)),
            eq(propertyImages.isActive, true),
            sql`${propertyImages.imageTag} IN ('video', 'youtube', 'tour')`,
          ),
        )
        .orderBy(propertyImages.imageOrder);

      const videos: { id: string; url: string }[] = [];
      const youtubeLinks: { id: string; url: string }[] = [];
      const virtualTours: { id: string; url: string }[] = [];

      for (const row of media) {
        const item = {
          id: row.propertyImageId.toString(),
          url: row.imageUrl,
        };
        if (row.imageTag === "video") videos.push(item);
        else if (row.imageTag === "youtube") youtubeLinks.push(item);
        else if (row.imageTag === "tour") virtualTours.push(item);
      }

      return { videos, youtubeLinks, virtualTours };
    } catch (error) {
      console.error("Error fetching property media:", error);
      return { videos: [], youtubeLinks: [], virtualTours: [] };
    }
  },
);

// Get all images for multiple properties at once (for feed view). The ids come
// from the browser (`fetchFeedImages`), so only properties this site publishes
// count: same gates as the listing grid (`buildWhereConditions`).
export const getImagesForListings = cache(
  async (propertyIds: bigint[]): Promise<Map<string, FeedImage[]>> => {
    if (propertyIds.length === 0) return new Map();

    try {
      const published = db
        .select({ propertyId: listings.propertyId })
        .from(listings)
        .where(and(...(await buildWhereConditions())));
      const images = await db
        .select({
          propertyId: propertyImages.propertyId,
          propertyImageId: propertyImages.propertyImageId,
          imageUrl: propertyImages.imageUrl,
          thumbUrl: propertyImages.thumbUrl,
          medUrl: propertyImages.medUrl,
          fullUrl: propertyImages.fullUrl,
          imageOrder: propertyImages.imageOrder,
          imageTag: propertyImages.imageTag,
        })
        .from(propertyImages)
        .where(
          and(
            inArray(propertyImages.propertyId, propertyIds),
            inArray(propertyImages.propertyId, published),
            eq(propertyImages.isActive, true),
            sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('tour', 'youtube', 'video'))`,
          ),
        )
        // Planos last, same rule as the card portada above — the feed card
        // swipes through these in a 4/3 box, so a floor plan first meant the
        // property opened on a cropped plan.
        .orderBy(
          propertyImages.propertyId,
          sql`(${propertyImages.imageTag} IS NOT DISTINCT FROM 'plano') ASC`,
          propertyImages.imageOrder,
        );

      const grouped = new Map<string, FeedImage[]>();
      for (const img of images) {
        const key = img.propertyId.toString();
        const entry: FeedImage = {
          propertyImageId: img.propertyImageId.toString(),
          imageUrl: img.medUrl ?? img.fullUrl ?? img.imageUrl,
          imageOrder: img.imageOrder,
          imageTag: img.imageTag,
        };
        const existing = grouped.get(key);
        if (existing) {
          existing.push(entry);
        } else {
          grouped.set(key, [entry]);
        }
      }
      return grouped;
    } catch (error) {
      console.error("Error fetching images for listings:", error);
      return new Map();
    }
  },
);
