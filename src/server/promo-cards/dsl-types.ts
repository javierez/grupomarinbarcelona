import { z } from "zod";

const opSchema = z.enum([
  "eq",
  "in",
  "lt",
  "lte",
  "gt",
  "gte",
  "between",
]);

export type DslOp = z.infer<typeof opSchema>;

const leafValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number(), z.boolean()])),
]);

const leafSchema = z.object({
  field: z.string().min(1),
  op: opSchema,
  value: leafValueSchema,
});

export type DslLeaf = z.infer<typeof leafSchema>;

export type DslNode =
  | DslLeaf
  | { all: DslNode[] }
  | { any: DslNode[] };

export const dslNodeSchema: z.ZodType<DslNode> = z.lazy(() =>
  z.union([
    leafSchema,
    z.object({ all: z.array(dslNodeSchema).min(1) }),
    z.object({ any: z.array(dslNodeSchema).min(1) }),
  ]),
);

const baseCardFields = {
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().default(""),
  imageUrl: z.string().min(1),
  position: z.number().int().nonnegative().optional(),
};

const listingQueryCard = z.object({
  ...baseCardFields,
  kind: z.literal("listing_query"),
  slug: z.string().min(1),
  filter: dslNodeSchema,
  ctaLabel: z.string().optional(),
});

const promotionQueryCard = z.object({
  ...baseCardFields,
  kind: z.literal("promotion_query"),
  slug: z.string().min(1),
  filter: dslNodeSchema,
  ctaLabel: z.string().optional(),
});

const promotionCard = z.object({
  ...baseCardFields,
  kind: z.literal("promotion"),
  promotionId: z.string().min(1),
  ctaLabel: z.string().optional(),
});

const staticLinkCard = z.object({
  ...baseCardFields,
  kind: z.literal("static_link"),
  href: z.string().min(1),
  ctaLabel: z.string().optional(),
});

export const promoCardSchema = z.discriminatedUnion("kind", [
  listingQueryCard,
  promotionQueryCard,
  promotionCard,
  staticLinkCard,
]);

export const promoCardsArraySchema = z.array(promoCardSchema);

export type PromoCard = z.infer<typeof promoCardSchema>;
export type ListingQueryCard = z.infer<typeof listingQueryCard>;
export type PromotionQueryCard = z.infer<typeof promotionQueryCard>;
export type PromotionCardRef = z.infer<typeof promotionCard>;
export type StaticLinkCard = z.infer<typeof staticLinkCard>;

// ─── Hero direct-access buttons ──────────────────────────────────────────
//
// The pills that replace the hero search bar when `heroDirectAccess` is on.
// Same four destination kinds as a promo card so `hrefForCard` and the
// collection resolver work on both; a button is a card with no image and no
// subtitle, and its copy is `label` rather than `title`.

const baseButtonFields = {
  id: z.string().min(1),
  label: z.string().min(1),
  position: z.number().int().nonnegative().optional(),
};

export const heroDirectButtonSchema = z.discriminatedUnion("kind", [
  z.object({
    ...baseButtonFields,
    kind: z.literal("listing_query"),
    slug: z.string().min(1),
    filter: dslNodeSchema,
  }),
  z.object({
    ...baseButtonFields,
    kind: z.literal("promotion_query"),
    slug: z.string().min(1),
    filter: dslNodeSchema,
  }),
  z.object({
    ...baseButtonFields,
    kind: z.literal("promotion"),
    promotionId: z.string().min(1),
  }),
  z.object({
    ...baseButtonFields,
    kind: z.literal("static_link"),
    href: z.string().min(1),
  }),
]);

export const heroDirectButtonsArraySchema = z.array(heroDirectButtonSchema);

export type HeroDirectButton = z.infer<typeof heroDirectButtonSchema>;
