"use server";

import { db } from "../db";
import { websiteProperties } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { env } from "~/env";
import {
  promoCardsArraySchema,
  heroDirectButtonsArraySchema,
  type PromoCard,
  type ListingQueryCard,
  type PromotionQueryCard,
  type HeroDirectButton,
} from "~/server/promo-cards/dsl-types";
import {
  translateListingDsl,
  translatePromotionDsl,
} from "~/server/promo-cards/dsl-translator";
import { searchListings, countListings, type ListingCardData } from "./listings";
import {
  searchPromotionsByPredicate,
  countPromotionsByPredicate,
  getPromotionDetail,
  type PromotionCardData,
  type PromotionDetailData,
} from "./promotions";

const ACCOUNT_ID = 141n;

export const getPromoCards = cache(
  async (accountIdArg?: bigint): Promise<PromoCard[]> => {
  try {
    const [config] = await db
      .select({ promoCardsProps: websiteProperties.promoCardsProps })
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, accountIdArg ?? ACCOUNT_ID))
      .limit(1);

    if (!config?.promoCardsProps) return [];
    const parsed = JSON.parse(config.promoCardsProps) as unknown;
    const result = promoCardsArraySchema.safeParse(parsed);
    if (!result.success) {
      console.error("Invalid promo cards JSON:", result.error.flatten());
      return [];
    }
    return [...result.data].sort(
      (a, b) => (a.position ?? 0) - (b.position ?? 0),
    );
  } catch (error) {
    console.error("Error fetching promo cards:", error);
    return [];
  }
});

/**
 * The hero's direct-access buttons, in display order.
 *
 * Stored inside `featuresProps` (not its own column) because they only exist
 * while `heroDirectAccess` is on, and that flag lives there. Invalid JSON gives
 * an empty list, which makes the hero fall back to the two built-in pills
 * rather than rendering nothing.
 */
export const getHeroDirectButtons = cache(
  async (accountIdArg?: bigint): Promise<HeroDirectButton[]> => {
    try {
      const [config] = await db
        .select({ featuresProps: websiteProperties.featuresProps })
        .from(websiteProperties)
        .where(eq(websiteProperties.accountId, accountIdArg ?? ACCOUNT_ID))
        .limit(1);

      if (!config?.featuresProps) return [];
      const parsed = JSON.parse(config.featuresProps) as {
        heroDirectButtons?: unknown;
      };
      if (parsed?.heroDirectButtons == null) return [];

      const result = heroDirectButtonsArraySchema.safeParse(
        parsed.heroDirectButtons,
      );
      if (!result.success) {
        console.error(
          "Invalid hero direct buttons JSON:",
          result.error.flatten(),
        );
        return [];
      }
      return [...result.data].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      );
    } catch (error) {
      console.error("Error fetching hero direct buttons:", error);
      return [];
    }
  },
);

/**
 * A hero button rendered as a card, so the collection page can show it.
 * The button carries no image or subtitle; its copy becomes the page title.
 */
function buttonAsCard(button: HeroDirectButton): PromoCard {
  const base = {
    id: button.id,
    title: button.label,
    subtitle: "",
    imageUrl: "",
    position: button.position,
  };
  switch (button.kind) {
    case "listing_query":
      return { ...base, kind: "listing_query", slug: button.slug, filter: button.filter };
    case "promotion_query":
      return { ...base, kind: "promotion_query", slug: button.slug, filter: button.filter };
    case "promotion":
      return { ...base, kind: "promotion", promotionId: button.promotionId };
    case "static_link":
      return { ...base, kind: "static_link", href: button.href };
  }
}

export type ResolvedListingQuery = {
  kind: "listing_query";
  card: ListingQueryCard;
  listings: ListingCardData[];
  /** Resultados que cumplen el filtro, no los de esta página. */
  total: number;
};

export type ResolvedPromotionQuery = {
  kind: "promotion_query";
  card: PromotionQueryCard;
  promotions: PromotionCardData[];
  /** Resultados que cumplen el filtro, no los de esta página. */
  total: number;
};

export type ResolvedPromotion = {
  kind: "promotion";
  card: PromoCard & { kind: "promotion" };
  promotion: PromotionDetailData | null;
};

export type ResolvedStaticLink = {
  kind: "static_link";
  card: PromoCard & { kind: "static_link" };
};

export type ResolvedCard =
  | ResolvedListingQuery
  | ResolvedPromotionQuery
  | ResolvedPromotion
  | ResolvedStaticLink;

/**
 * La tarjeta (o el botón del hero) que responde a este slug, sin ejecutar su
 * consulta. `generateMetadata` sólo necesita título y subtítulo, y resolver la
 * tarjeta entera le costaba una búsqueda de anuncios por cada carga de página.
 */
export async function findPromoCardBySlug(
  slug: string,
): Promise<ListingQueryCard | PromotionQueryCard | null> {
  const isQueryWithSlug = (
    c: { kind: string; slug?: string },
  ): boolean =>
    (c.kind === "listing_query" || c.kind === "promotion_query") &&
    c.slug === slug;

  const cards = await getPromoCards();
  // A hero direct-access button can carry its own filter, so its collection
  // has to resolve too — the cards win a slug collision because their URL is
  // the one that has been public for longer.
  const card =
    cards.find(isQueryWithSlug) ??
    (await getHeroDirectButtons()).filter(isQueryWithSlug).map(buttonAsCard)[0];
  if (!card) return null;
  if (card.kind !== "listing_query" && card.kind !== "promotion_query") {
    return null;
  }
  return card;
}

export async function resolvePromoCardBySlug(
  slug: string,
  limit = 24,
  offset = 0,
): Promise<ResolvedCard | null> {
  const card = await findPromoCardBySlug(slug);
  if (!card) return null;

  if (card.kind === "listing_query") {
    try {
      const predicate = await translateListingDsl(card.filter);
      // El total sale del mismo predicado que la página: `countListings` acepta
      // `extraPredicate` justo para no desincronizarse de `searchListings`.
      const [results, total] = await Promise.all([
        searchListings(undefined, limit, "default", offset, predicate),
        countListings(undefined, predicate),
      ]);
      return { kind: "listing_query", card, listings: results, total };
    } catch (e) {
      console.error("DSL translation failed for listing card", card.id, e);
      return { kind: "listing_query", card, listings: [], total: 0 };
    }
  }

  try {
    const predicate = await translatePromotionDsl(card.filter);
    const [results, total] = await Promise.all([
      searchPromotionsByPredicate(predicate, limit, offset),
      countPromotionsByPredicate(predicate),
    ]);
    return { kind: "promotion_query", card, promotions: results, total };
  } catch (e) {
    console.error("DSL translation failed for promotion card", card.id, e);
    return { kind: "promotion_query", card, promotions: [], total: 0 };
  }
}

export async function getPromotionForCard(
  promotionId: string,
): Promise<PromotionDetailData | null> {
  return getPromotionDetail(promotionId);
}
