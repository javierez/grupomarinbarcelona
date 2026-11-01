import type { HeroDirectButton, PromoCard } from "./dsl-types";

/**
 * Where a destination points. Promo cards and the hero's direct-access buttons
 * carry the same four `kind`s, so both resolve through this one switch — a
 * button that links to a filtered collection lands on the same
 * `/coleccion/<slug>` page a card would.
 */
export function hrefForCard(card: PromoCard | HeroDirectButton): string {
  switch (card.kind) {
    case "listing_query":
    case "promotion_query":
      return `/coleccion/${card.slug}`;
    case "promotion":
      return `/promociones?promotion=${card.promotionId}`;
    case "static_link":
      return card.href;
  }
}
