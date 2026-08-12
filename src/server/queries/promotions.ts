"use server";

import { db } from "../db";
import {
  promotions,
  promotionImages,
  listings,
  locations,
} from "~/server/db/schema";
import { and, eq, exists, sql, desc, inArray, type SQL } from "drizzle-orm";
import { cache } from "react";
import { env } from "~/env";

import { visibleStatusCondition } from "./filters";
import { getPropertiesConfig } from "./website-config";

const ACCOUNT_ID = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

export interface PromotionCardData {
  promotionId: string;
  name: string;
  newDevelopmentType: string | null;
  forSale: boolean;
  forRent: boolean;
  description: string | null;
  mainImageUrl: string | null;
  listingCount: number;
  minPrice: string | null;
  maxPrice: string | null;
}

export interface PromotionDetailData extends PromotionCardData {
  // Address
  street: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  // Construction
  finished: boolean | null;
  keyDeliveryYear: number | null;
  keyDeliveryMonth: number | null;
  builtPhase: string | null;
  // Energy
  energyCertificateRating: string | null;
  // Outside-the-house amenities
  hasPool: boolean | null;
  hasGarden: boolean | null;
  // Inside-the-house amenities
  hasLift: boolean | null;
  hasSecurityDoor: boolean | null;
  hasSecurityAlarm: boolean | null;
  hasDoorman: boolean | null;
}

// Fetch the first (lowest imageOrder) active, non-video cover image for each
// promotion id, in a single query. Returns a Map keyed by promotion id.
// `hiRes` selects full/med-quality variants for hero-sized renders (detail
// panel); the default thumb-first ordering keeps card grids lightweight.
async function getCoverImagesFor(
  promotionIds: bigint[],
  _hiRes = false,
): Promise<Map<string, string>> {
  if (promotionIds.length === 0) return new Map();
  // Use the same COALESCE priority across card grid and detail panel so they
  // always resolve to the same URL on the same row (avoids cases where
  // thumb_url and full_url on one row point to different photos).
  const urlExpr = sql<string>`COALESCE(${promotionImages.fullUrl}, ${promotionImages.medUrl}, ${promotionImages.imageUrl}, ${promotionImages.thumbUrl})`;
  const rows = await db
    .selectDistinctOn([promotionImages.promotionId], {
      promotionId: promotionImages.promotionId,
      url: urlExpr,
    })
    .from(promotionImages)
    .where(
      and(
        inArray(promotionImages.promotionId, promotionIds),
        eq(promotionImages.isActive, true),
        sql`(${promotionImages.imageTag} IS NULL OR ${promotionImages.imageTag} NOT IN ('tour', 'youtube', 'video'))`,
      ),
    )
    .orderBy(promotionImages.promotionId, promotionImages.imageOrder, promotionImages.promotionImageId);

  const map = new Map<string, string>();
  for (const r of rows) if (r.url) map.set(r.promotionId.toString(), r.url);
  return map;
}

interface ListingStats {
  count: number;
  min: string | null;
  max: string | null;
}

async function getListingStatsFor(
  promotionIds: bigint[],
): Promise<Map<string, ListingStats>> {
  if (promotionIds.length === 0) return new Map();
  // Sin filtro de estado, el "X viviendas" y la horquilla de precios de una
  // promoción contaban también las unidades ya vendidas. Se notaba poco mientras
  // una venta apagaba `publishToWebsite` en el acto; con la ventana de
  // escaparate encendida esa unidad sigue marcada y el contador mentiría.
  const { soldVisibilityDays } = await getPropertiesConfig();
  const rows = await db
    .select({
      promotionId: listings.promotionId,
      count: sql<number>`COUNT(*)`,
      min: sql<string | null>`MIN(CAST(${listings.price} AS DECIMAL))`,
      max: sql<string | null>`MAX(CAST(${listings.price} AS DECIMAL))`,
    })
    .from(listings)
    .where(
      and(
        inArray(listings.promotionId, promotionIds),
        eq(listings.accountId, ACCOUNT_ID),
        eq(listings.isActive, true),
        eq(listings.publishToWebsite, true),
        visibleStatusCondition(soldVisibilityDays),
      ),
    )
    .groupBy(listings.promotionId);

  const map = new Map<string, ListingStats>();
  for (const r of rows) {
    if (r.promotionId == null) continue;
    map.set(r.promotionId.toString(), {
      count: Number(r.count ?? 0),
      min: r.min ? r.min.toString() : null,
      max: r.max ? r.max.toString() : null,
    });
  }
  return map;
}

// Returns all active promotions for the account, with cover image, unit count
// and price range derived from joined published listings.
export const getPromotionsForAccount = cache(
  async (): Promise<PromotionCardData[]> => {
    try {
      const rows = await db
        .select({
          promotionId: promotions.promotionId,
          name: promotions.name,
          newDevelopmentType: promotions.newDevelopmentType,
          forSale: promotions.forSale,
          forRent: promotions.forRent,
          description: promotions.description,
        })
        .from(promotions)
        .where(
          and(
            eq(promotions.accountId, ACCOUNT_ID),
            eq(promotions.isActive, true),
          ),
        )
        .orderBy(desc(promotions.createdAt));

      const ids = rows.map((r) => r.promotionId);
      const [covers, stats] = await Promise.all([
        getCoverImagesFor(ids),
        getListingStatsFor(ids),
      ]);

      return rows
        .map((r) => {
          const key = r.promotionId.toString();
          const s = stats.get(key);
          return {
            promotionId: key,
            name: r.name,
            newDevelopmentType: r.newDevelopmentType,
            forSale: r.forSale ?? false,
            forRent: r.forRent ?? false,
            description: r.description,
            mainImageUrl: covers.get(key) ?? null,
            listingCount: s?.count ?? 0,
            minPrice: s?.min ?? null,
            maxPrice: s?.max ?? null,
          };
        })
        // Hide promotions with no published units — an empty promotion card
        // links nowhere useful. stats only counts active/published listings.
        .filter((p) => p.listingCount > 0);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return [];
    }
  },
);

/**
 * "Esta promoción tiene al menos una vivienda publicada", en SQL.
 *
 * La misma regla que aplicaba `.filter((p) => p.listingCount > 0)` en memoria.
 * Al pasarla al WHERE, `LIMIT/OFFSET` y `COUNT(*)` cuentan lo mismo que se
 * pinta: descartar filas después del LIMIT dejaba páginas cortas (24 pedidas,
 * 19 mostradas) y un total que no cuadraba con las páginas.
 */
function hasPublishedUnitsCondition(soldVisibilityDays: number): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(listings)
      .where(
        and(
          eq(listings.promotionId, promotions.promotionId),
          eq(listings.accountId, ACCOUNT_ID),
          eq(listings.isActive, true),
          eq(listings.publishToWebsite, true),
          visibleStatusCondition(soldVisibilityDays),
        ),
      ),
  );
}

export const countPromotionsByPredicate = cache(
  async (extraPredicate: SQL): Promise<number> => {
    try {
      const { soldVisibilityDays } = await getPropertiesConfig();
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(promotions)
        .where(
          and(
            eq(promotions.accountId, ACCOUNT_ID),
            eq(promotions.isActive, true),
            hasPublishedUnitsCondition(soldVisibilityDays),
            extraPredicate,
          ),
        );
      return Number(result[0]?.count ?? 0);
    } catch (error) {
      console.error("Error counting promotions by predicate:", error);
      return 0;
    }
  },
);

export const searchPromotionsByPredicate = cache(
  async (
    extraPredicate: SQL,
    limit = 12,
    offset = 0,
  ): Promise<PromotionCardData[]> => {
    try {
      const { soldVisibilityDays } = await getPropertiesConfig();
      const rows = await db
        .select({
          promotionId: promotions.promotionId,
          name: promotions.name,
          newDevelopmentType: promotions.newDevelopmentType,
          forSale: promotions.forSale,
          forRent: promotions.forRent,
          description: promotions.description,
        })
        .from(promotions)
        .where(
          and(
            eq(promotions.accountId, ACCOUNT_ID),
            eq(promotions.isActive, true),
            hasPublishedUnitsCondition(soldVisibilityDays),
            extraPredicate,
          ),
        )
        // `createdAt` puede repetirse entre promociones sembradas a la vez, y
        // un orden ambiguo hace que una misma fila aparezca en dos páginas.
        .orderBy(desc(promotions.createdAt), desc(promotions.promotionId))
        .limit(limit)
        .offset(offset);

      const ids = rows.map((r) => r.promotionId);
      const [covers, stats] = await Promise.all([
        getCoverImagesFor(ids),
        getListingStatsFor(ids),
      ]);

      return rows
        .map((r) => {
          const key = r.promotionId.toString();
          const s = stats.get(key);
          return {
            promotionId: key,
            name: r.name,
            newDevelopmentType: r.newDevelopmentType,
            forSale: r.forSale ?? false,
            forRent: r.forRent ?? false,
            description: r.description,
            mainImageUrl: covers.get(key) ?? null,
            listingCount: s?.count ?? 0,
            minPrice: s?.min ?? null,
            maxPrice: s?.max ?? null,
          };
        });
      // El "tiene viviendas publicadas" ya lo aplica
      // `hasPublishedUnitsCondition` en el WHERE, así que aquí no se descarta
      // nada: filtrar después del LIMIT acortaría la página.
    } catch (error) {
      console.error("Error searching promotions by predicate:", error);
      return [];
    }
  },
);

// All gallery images for a single promotion — used by the promotion detail
// page to render a Pinterest-style masonry gallery. Excludes video/tour tags.
export const getPromotionImages = cache(
  async (promotionId: string): Promise<{ id: string; url: string; alt: string | null }[]> => {
    try {
      const id = BigInt(promotionId);
      const rows = await db
        .select({
          id: promotionImages.promotionImageId,
          url: sql<string>`COALESCE(${promotionImages.medUrl}, ${promotionImages.fullUrl}, ${promotionImages.imageUrl})`,
          alt: promotionImages.imageTag,
        })
        .from(promotionImages)
        .where(
          and(
            eq(promotionImages.promotionId, id),
            eq(promotionImages.isActive, true),
            sql`(${promotionImages.imageTag} IS NULL OR ${promotionImages.imageTag} NOT IN ('tour', 'youtube', 'video'))`,
          ),
        )
        .orderBy(promotionImages.imageOrder, promotionImages.promotionImageId);

      return rows.map((r) => ({
        id: r.id.toString(),
        url: r.url,
        alt: r.alt,
      }));
    } catch (error) {
      console.error("Error fetching promotion images:", error);
      return [];
    }
  },
);

// Full detail for the selected promotion — includes address, amenities,
// energy rating and construction phase. Used by /promociones?promotion=X to
// show a rich panel instead of the thin card.
export const getPromotionDetail = cache(
  async (promotionId: string): Promise<PromotionDetailData | null> => {
    try {
      const id = BigInt(promotionId);
      const rows = await db
        .select({
          promotionId: promotions.promotionId,
          name: promotions.name,
          newDevelopmentType: promotions.newDevelopmentType,
          forSale: promotions.forSale,
          forRent: promotions.forRent,
          description: promotions.description,
          street: promotions.street,
          postalCode: promotions.postalCode,
          finished: promotions.finished,
          keyDeliveryYear: promotions.keyDeliveryYear,
          keyDeliveryMonth: promotions.keyDeliveryMonth,
          builtPhase: promotions.builtPhase,
          energyCertificateRating: promotions.energyCertificateRating,
          hasPool: promotions.hasPool,
          hasGarden: promotions.hasGarden,
          hasLift: promotions.hasLift,
          hasSecurityDoor: promotions.hasSecurityDoor,
          hasSecurityAlarm: promotions.hasSecurityAlarm,
          hasDoorman: promotions.hasDoorman,
          city: locations.city,
          province: locations.province,
        })
        .from(promotions)
        .leftJoin(
          locations,
          eq(promotions.neighborhoodId, locations.neighborhoodId),
        )
        .where(
          and(
            eq(promotions.promotionId, id),
            eq(promotions.accountId, ACCOUNT_ID),
            eq(promotions.isActive, true),
          ),
        )
        .limit(1);

      const r = rows[0];
      if (!r) return null;

      const [covers, stats] = await Promise.all([
        getCoverImagesFor([id], true),
        getListingStatsFor([id]),
      ]);
      const key = id.toString();
      const s = stats.get(key);

      return {
        promotionId: key,
        name: r.name,
        newDevelopmentType: r.newDevelopmentType,
        forSale: r.forSale ?? false,
        forRent: r.forRent ?? false,
        description: r.description,
        mainImageUrl: covers.get(key) ?? null,
        listingCount: s?.count ?? 0,
        minPrice: s?.min ?? null,
        maxPrice: s?.max ?? null,
        street: r.street,
        postalCode: r.postalCode,
        city: r.city,
        province: r.province,
        finished: r.finished,
        keyDeliveryYear: r.keyDeliveryYear,
        keyDeliveryMonth: r.keyDeliveryMonth,
        builtPhase: r.builtPhase,
        energyCertificateRating: r.energyCertificateRating,
        hasPool: r.hasPool,
        hasGarden: r.hasGarden,
        hasLift: r.hasLift,
        hasSecurityDoor: r.hasSecurityDoor,
        hasSecurityAlarm: r.hasSecurityAlarm,
        hasDoorman: r.hasDoorman,
      };
    } catch (error) {
      console.error("Error fetching promotion detail:", error);
      return null;
    }
  },
);
