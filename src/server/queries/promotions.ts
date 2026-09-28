"use server";

import { db } from "../db";
import {
  promotions,
  promotionImages,
  listings,
  locations,
  documents,
} from "~/server/db/schema";
import { and, eq, exists, sql, desc, inArray, type SQL } from "drizzle-orm";
import { cache } from "react";
import { env } from "~/env";

import { hasAtLeastOnePhoto, visibleStatusCondition } from "./filters";
import { getPropertiesConfig } from "./website-config";
import { getImageAspects } from "./image-dimensions";
import {
  sortPromotionDocuments,
  PUBLIC_PROMOTION_DOCUMENT_TAGS,
  type PromotionDocument,
} from "~/lib/promotion-documents";

const ACCOUNT_ID = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

export interface PromotionCardData {
  promotionId: string;
  name: string;
  newDevelopmentType: string | null;
  forSale: boolean;
  forRent: boolean;
  description: string | null;
  street: string | null;
  builtPhase: string | null;
  keyDeliveryYear: number | null;
  keyDeliveryMonth: number | null;
  mainImageUrl: string | null;
  /** Ancho / alto de la portada, para que la tarjeta adopte su forma. */
  mainImageAspect: number | null;
  listingCount: number;
  minPrice: string | null;
  maxPrice: string | null;
  /**
   * El "desde X €" que la agencia teclea en la propia promoción. Existe justo
   * para la obra nueva que todavía no tiene ninguna unidad enlazada, así que
   * sólo se usa cuando `minPrice`/`maxPrice` vienen vacíos.
   */
  priceFrom: string | null;
}

export interface PromotionDetailData extends PromotionCardData {
  // Address
  postalCode: string | null;
  city: string | null;
  province: string | null;
  // Construction
  finished: boolean | null;
  startDate: string | null;
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
  // PDFs de la promoción (memoria de calidades, dossier)
  documents: PromotionDocument[];
}

// Las tres consultas de tarjetas (listado, buscador y colecciones de la
// portada) leen exactamente las mismas columnas y montan el mismo objeto. Se
// comparten para que añadir un dato a la tarjeta sea un solo sitio y no tres.
const promotionCardColumns = {
  promotionId: promotions.promotionId,
  name: promotions.name,
  newDevelopmentType: promotions.newDevelopmentType,
  forSale: promotions.forSale,
  forRent: promotions.forRent,
  description: promotions.description,
  street: promotions.street,
  builtPhase: promotions.builtPhase,
  keyDeliveryYear: promotions.keyDeliveryYear,
  keyDeliveryMonth: promotions.keyDeliveryMonth,
  priceFrom: promotions.priceFrom,
};

type PromotionCardRow = {
  promotionId: bigint;
  name: string;
  newDevelopmentType: string | null;
  forSale: boolean | null;
  forRent: boolean | null;
  description: string | null;
  street: string | null;
  builtPhase: string | null;
  keyDeliveryYear: number | null;
  keyDeliveryMonth: number | null;
  priceFrom: string | null;
};

function toPromotionCardData(
  r: PromotionCardRow,
  covers: Map<string, string>,
  stats: Map<string, ListingStats>,
  aspects: Map<string, number>,
): PromotionCardData {
  const key = r.promotionId.toString();
  const s = stats.get(key);
  const mainImageUrl = covers.get(key) ?? null;
  return {
    promotionId: key,
    name: r.name,
    newDevelopmentType: r.newDevelopmentType,
    forSale: r.forSale ?? false,
    forRent: r.forRent ?? false,
    description: r.description,
    street: r.street,
    builtPhase: r.builtPhase,
    keyDeliveryYear: r.keyDeliveryYear,
    keyDeliveryMonth: r.keyDeliveryMonth,
    priceFrom: r.priceFrom,
    mainImageUrl,
    mainImageAspect: mainImageUrl ? (aspects.get(mainImageUrl) ?? null) : null,
    listingCount: s?.count ?? 0,
    minPrice: s?.min ?? null,
    maxPrice: s?.max ?? null,
  };
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
    .orderBy(
      promotionImages.promotionId,
      promotionImages.imageOrder,
      promotionImages.promotionImageId,
    );

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
  //
  // Mismas puertas que la lista de unidades (foto incluida): el contador decía
  // "N unidades" contando las que la lista no enseña. Y la horquilla solo con
  // precios visibles: un "Desde 180.000 €" delataba el de una unidad publicada
  // como "A consultar".
  const { soldVisibilityDays } = await getPropertiesConfig();
  const visiblePrice = sql`CASE WHEN ${listings.fcPriceVisibility} THEN NULL ELSE NULLIF(CAST(${listings.price} AS DECIMAL), 0) END`;
  const rows = await db
    .select({
      promotionId: listings.promotionId,
      count: sql<number>`COUNT(*)`,
      min: sql<string | null>`MIN(${visiblePrice})`,
      max: sql<string | null>`MAX(${visiblePrice})`,
    })
    .from(listings)
    .where(
      and(
        inArray(listings.promotionId, promotionIds),
        eq(listings.accountId, ACCOUNT_ID),
        eq(listings.isActive, true),
        eq(listings.publishToWebsite, true),
        visibleStatusCondition(soldVisibilityDays),
        hasAtLeastOnePhoto(listings.propertyId),
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
        .select(promotionCardColumns)
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
      const aspects = await getImageAspects([...covers.values()]);

      return (
        rows
          .map((r) => toPromotionCardData(r, covers, stats, aspects))
          // La misma regla que `hasSomethingToShowCondition` aplica en SQL.
          .filter(
            (p) =>
              p.listingCount > 0 ||
              Boolean(p.mainImageUrl) ||
              Boolean(p.description?.trim()),
          )
      );
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return [];
    }
  },
);

/**
 * "Esta promoción tiene al menos una vivienda publicada", en SQL.
 *
 * Al vivir en el WHERE, `LIMIT/OFFSET` y `COUNT(*)` cuentan lo mismo que se
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

/** "Esta promoción tiene al menos una foto publicable", en SQL. */
function hasCoverImageCondition(): SQL {
  return exists(
    db
      .select({ one: sql`1` })
      .from(promotionImages)
      .where(
        and(
          eq(promotionImages.promotionId, promotions.promotionId),
          eq(promotionImages.isActive, true),
          sql`(${promotionImages.imageTag} IS NULL OR ${promotionImages.imageTag} NOT IN ('tour', 'youtube', 'video'))`,
        ),
      ),
  );
}

/**
 * "Esta promoción tiene algo que enseñar", en SQL.
 *
 * Antes la regla era sólo "tiene viviendas publicadas", y dejaba fuera la obra
 * nueva en precomercialización: la agencia carga fotos, memoria y fecha de
 * entrega meses antes de dar de alta la primera unidad, así que la promoción
 * desaparecía de la web justo cuando más interesa enseñarla.
 *
 * El filtro no se puede quitar del todo: el CRM crea la promoción vacía con el
 * nombre "Nueva promoción", y esas filas no tienen ni foto ni descripción.
 * Publicarlas llenaría la web de la agencia de tarjetas grises sin contenido.
 */
function hasSomethingToShowCondition(soldVisibilityDays: number): SQL {
  return sql`(${hasPublishedUnitsCondition(soldVisibilityDays)} OR ${hasCoverImageCondition()} OR COALESCE(TRIM(${promotions.description}), '') <> '')`;
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
            hasSomethingToShowCondition(soldVisibilityDays),
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
        .select(promotionCardColumns)
        .from(promotions)
        .where(
          and(
            eq(promotions.accountId, ACCOUNT_ID),
            eq(promotions.isActive, true),
            hasSomethingToShowCondition(soldVisibilityDays),
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

      const aspects = await getImageAspects([...covers.values()]);

      return rows.map((r) => toPromotionCardData(r, covers, stats, aspects));
      // El "tiene algo que enseñar" ya lo aplica
      // `hasSomethingToShowCondition` en el WHERE, así que aquí no se descarta
      // nada: filtrar después del LIMIT acortaría la página.
    } catch (error) {
      console.error("Error searching promotions by predicate:", error);
      return [];
    }
  },
);

// All gallery images for a single promotion — used by the promotion detail
// page to render a Pinterest-style masonry gallery. Excludes video/tour tags.
export interface PromotionImage {
  id: string;
  url: string;
  alt: string | null;
  /** Ancho / alto real. `null` cuando no se ha podido medir la imagen. */
  aspect: number | null;
}

export const getPromotionImages = cache(
  async (promotionId: string): Promise<PromotionImage[]> => {
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

      const aspects = await getImageAspects(rows.map((r) => r.url));

      return rows.map((r) => ({
        id: r.id.toString(),
        url: r.url,
        alt: r.alt,
        aspect: aspects.get(r.url) ?? null,
      }));
    } catch (error) {
      console.error("Error fetching promotion images:", error);
      return [];
    }
  },
);

/**
 * Los PDFs publicables de una promoción, ya como filas de `documents` (0340).
 *
 * `documents` no tiene `account_id`: el aislamiento entre agencias sale del
 * JOIN con `promotions`, así que este join no es decorativo — quitarlo
 * enseñaría el dossier de otra agencia.
 */
async function getPublicPromotionDocuments(
  promotionId: bigint,
): Promise<PromotionDocument[]> {
  const rows = await db
    .select({
      tag: documents.documentTag,
      url: documents.fileUrl,
      filename: documents.filename,
      uploadedAt: documents.uploadedAt,
    })
    .from(documents)
    .innerJoin(promotions, eq(documents.promotionId, promotions.promotionId))
    .where(
      and(
        eq(documents.promotionId, promotionId),
        eq(documents.isActive, true),
        eq(promotions.accountId, ACCOUNT_ID),
        inArray(documents.documentTag, [...PUBLIC_PROMOTION_DOCUMENT_TAGS]),
      ),
    )
    .orderBy(desc(documents.uploadedAt));

  // Uno por etiqueta: el CRM permite acumular varias memorias, la vigente es la
  // última subida. `orderBy` ya las trae en ese orden.
  const seen = new Set<string>();
  const latest = rows.filter((r) => {
    const tag = r.tag ?? "";
    if (seen.has(tag)) return false;
    seen.add(tag);
    return true;
  });

  return sortPromotionDocuments(
    latest.map((r) => ({ tag: r.tag ?? "", url: r.url, filename: r.filename })),
  );
}

// Full detail for the selected promotion — includes address, amenities,
// energy rating and construction phase. Used by /promociones?promotion=X to
// show a rich panel instead of the thin card.
export const getPromotionDetail = cache(
  async (promotionId: string): Promise<PromotionDetailData | null> => {
    try {
      const id = BigInt(promotionId);
      const rows = await db
        .select({
          ...promotionCardColumns,
          postalCode: promotions.postalCode,
          finished: promotions.finished,
          startDate: promotions.startDate,
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

      const [covers, stats, docs] = await Promise.all([
        getCoverImagesFor([id], true),
        getListingStatsFor([id]),
        getPublicPromotionDocuments(id),
      ]);
      const aspects = await getImageAspects([...covers.values()]);

      return {
        ...toPromotionCardData(r, covers, stats, aspects),
        postalCode: r.postalCode,
        city: r.city,
        province: r.province,
        finished: r.finished,
        startDate: r.startDate,
        energyCertificateRating: r.energyCertificateRating,
        hasPool: r.hasPool,
        hasGarden: r.hasGarden,
        hasLift: r.hasLift,
        hasSecurityDoor: r.hasSecurityDoor,
        hasSecurityAlarm: r.hasSecurityAlarm,
        hasDoorman: r.hasDoorman,
        documents: docs,
      };
    } catch (error) {
      console.error("Error fetching promotion detail:", error);
      return null;
    }
  },
);

/**
 * Los PDFs de la promoción a la que pertenece una unidad.
 *
 * Existe para la ficha del inmueble: una memoria de calidades describe el
 * edificio entero, la agencia la sube una vez en la promoción y las N unidades
 * enlazadas la enseñan. La unidad no guarda copia — se resuelve por
 * `listings.promotion_id`.
 *
 * Devuelve `null` (y no un array vacío) cuando la unidad no cuelga de ninguna
 * promoción, para que quien llama sepa distinguir "no hay promoción" de
 * "promoción sin documentos".
 */
export const getPromotionDocumentsForListing = cache(
  async (
    listingId: number,
  ): Promise<{ name: string; documents: PromotionDocument[] } | null> => {
    try {
      const rows = await db
        .select({
          promotionId: promotions.promotionId,
          name: promotions.name,
        })
        .from(listings)
        .innerJoin(promotions, eq(listings.promotionId, promotions.promotionId))
        .where(
          and(
            eq(listings.listingId, BigInt(listingId)),
            eq(listings.accountId, ACCOUNT_ID),
            eq(promotions.accountId, ACCOUNT_ID),
            eq(promotions.isActive, true),
          ),
        )
        .limit(1);

      const r = rows[0];
      if (!r) return null;

      return {
        name: r.name,
        documents: await getPublicPromotionDocuments(r.promotionId),
      };
    } catch (error) {
      console.error("Error fetching promotion documents for listing:", error);
      return null;
    }
  },
);
