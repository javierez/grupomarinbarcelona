"use server";

import { db } from "../db";
import { websiteProperties, listings } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { z } from "zod";
import { env } from "~/env";
import type { BannerProps } from "~/lib/data";
import { buildPropertySlug } from "~/lib/property-slug";
import { searchListings, type ListingCardData } from "./listings";
import {
  getPromotionDetail,
  getPromotionsForAccount,
  type PromotionDetailData,
} from "./promotions";
import { buildPromotionPriceLabel } from "~/components/promociones/promotion-utils";

const NONE: BannerProps = { kind: "none" };

const bannerCommon = {
  overlay: z.boolean().optional(),
  align: z.enum(["left", "center"]).optional(),
  fit: z.enum(["cover", "contain"]).optional(),
  bare: z.boolean().optional(),
};

// Zod mirror of BannerProps in src/lib/data.ts. Anything that doesn't validate
// falls back to "none", so a malformed banner can never break the homepage.
const bannerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({
    kind: z.literal("custom"),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
    ...bannerCommon,
  }),
  z.object({
    kind: z.literal("promotion"),
    promotionId: z.string().min(1),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    ctaLabel: z.string().optional(),
    ...bannerCommon,
  }),
  z.object({
    kind: z.literal("listing"),
    listingId: z.string().min(1),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    backgroundImage: z.string().optional(),
    ctaLabel: z.string().optional(),
    ...bannerCommon,
  }),
  z.object({
    kind: z.literal("promotions"),
    eyebrow: z.string().optional(),
    ctaLabel: z.string().optional(),
    intervalMs: z.number().int().positive().optional(),
    ...bannerCommon,
  }),
]);

/**
 * Raw banner config for the account, straight from `website_config.banner_props`.
 * Defaults to { kind: "none" } when unset, malformed, or if the column does not
 * exist yet (so this is safe to deploy before the migration runs).
 */
export const getBannerProps = cache(
  async (accountIdArg?: bigint): Promise<BannerProps> => {
    try {
      const accountId = accountIdArg ?? BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);
      const [config] = await db
        .select({ bannerProps: websiteProperties.bannerProps })
        .from(websiteProperties)
        .where(eq(websiteProperties.accountId, accountId))
        .limit(1);

      if (!config?.bannerProps) return NONE;
      const parsed = JSON.parse(config.bannerProps) as unknown;
      const result = bannerSchema.safeParse(parsed);
      if (!result.success) {
        console.error("Invalid banner_props JSON:", result.error.flatten());
        return NONE;
      }
      return result.data;
    } catch (error) {
      console.error("Error fetching banner props:", error);
      return NONE;
    }
  },
);

// Everything the presentational banner needs, regardless of source `kind`.
export type ResolvedBanner = {
  /** Small eyebrow label above the title (e.g. "Promoción destacada"). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  ctaLabel?: string;
  ctaHref?: string;
  overlay: boolean;
  align: "left" | "center";
  /** "cover" crops to fill; "contain" shows the whole image over a blurred fill. */
  fit: "cover" | "contain";
  /** Chromeless: transparent bg, no shadow/ring/gradient — just the image. */
  bare: boolean;
};

async function fetchListing(listingId: string): Promise<ListingCardData | null> {
  try {
    const [row] = await searchListings(
      undefined,
      1,
      "default",
      0,
      eq(listings.listingId, BigInt(listingId)),
    );
    return row ?? null;
  } catch (error) {
    console.error("Banner: failed to resolve listing", listingId, error);
    return null;
  }
}

/**
 * Resolve the configured banner into render-ready data, pulling promotion /
 * listing records and merging the optional config overrides. Returns null when
 * the banner is "none" or the linked record can't be found — caller renders
 * nothing in that case.
 */
export const getResolvedBanner = cache(
  async (accountIdArg?: bigint): Promise<ResolvedBanner | null> => {
    const banner = await getBannerProps(accountIdArg);
    if (banner.kind === "none") return null;
    // The rotating "promotions" banner is resolved into multiple slides by
    // getResolvedBannerSlides; it has no single-banner representation.
    if (banner.kind === "promotions") return null;

    const overlay = banner.overlay ?? true;
    const align = banner.align ?? "left";
    const fit = banner.fit ?? "cover";
    const bare = banner.bare ?? false;

    if (banner.kind === "custom") {
      if (!banner.title && !banner.backgroundImage) return null;
      return {
        title: banner.title ?? "",
        subtitle: banner.subtitle,
        backgroundImage: banner.backgroundImage,
        ctaLabel: banner.ctaLabel,
        ctaHref: banner.ctaHref,
        overlay,
        align,
        fit,
        bare,
      };
    }

    if (banner.kind === "promotion") {
      const promo: PromotionDetailData | null = await getPromotionDetail(
        banner.promotionId,
      );
      if (!promo) return null;
      return {
        title: banner.title ?? promo.name,
        subtitle:
          banner.subtitle ??
          ([promo.city, promo.province].filter(Boolean).join(", ") || undefined),
        backgroundImage: banner.backgroundImage ?? promo.mainImageUrl ?? undefined,
        ctaLabel: banner.ctaLabel ?? "Ver promoción",
        ctaHref: `/promociones?promotion=${promo.promotionId}`,
        overlay,
        align,
        fit,
        bare,
      };
    }

    // kind === "listing"
    const listing = await fetchListing(banner.listingId);
    if (!listing) return null;
    return {
      title: banner.title ?? listing.title ?? "",
      subtitle:
        banner.subtitle ??
        ([listing.city, listing.province].filter(Boolean).join(", ") ||
          undefined),
      backgroundImage: banner.backgroundImage ?? listing.imageUrl ?? undefined,
      ctaLabel: banner.ctaLabel ?? "Ver propiedad",
      ctaHref: `/propiedades/${buildPropertySlug({
        listingId: listing.listingId,
        title: listing.title,
        propertyType: listing.propertyType,
        city: listing.city,
        bedrooms: listing.bedrooms,
        listingType: listing.listingType,
      })}`,
      overlay,
      align,
      fit,
      bare,
    };
  },
);

export type ResolvedBannerSlides = {
  slides: ResolvedBanner[];
  /** Milliseconds each slide stays on screen before advancing. */
  intervalMs: number;
};

/**
 * Resolve the banner into a list of slides. For most kinds this is a single
 * slide (delegating to getResolvedBanner). For kind "promotions" it returns one
 * slide per active promotion, so the homepage banner can rotate through them and
 * link each slide to its promotion page. Returns null when there's nothing to
 * show.
 */
export const getResolvedBannerSlides = cache(
  async (accountIdArg?: bigint): Promise<ResolvedBannerSlides | null> => {
    const banner = await getBannerProps(accountIdArg);
    if (banner.kind === "none") return null;

    if (banner.kind === "promotions") {
      const overlay = banner.overlay ?? true;
      const align = banner.align ?? "left";
      const fit = banner.fit ?? "cover";
      const bare = banner.bare ?? false;
      const promotions = await getPromotionsForAccount();
      const slides: ResolvedBanner[] = promotions
        .filter((p) => p.mainImageUrl)
        .map((p) => ({
          eyebrow: banner.eyebrow ?? "Promoción",
          title: p.name,
          subtitle: buildPromotionPriceLabel(p.minPrice, p.maxPrice) ?? undefined,
          backgroundImage: p.mainImageUrl ?? undefined,
          ctaLabel: banner.ctaLabel ?? "Ver promoción",
          ctaHref: `/promociones?promotion=${p.promotionId}`,
          overlay,
          align,
          fit,
          bare,
        }));
      if (slides.length === 0) return null;
      return { slides, intervalMs: banner.intervalMs ?? 5000 };
    }

    const single = await getResolvedBanner(accountIdArg);
    if (!single) return null;
    return { slides: [single], intervalMs: 5000 };
  },
);
