import { getSEOConfig } from "./website-config";
import { getHeroProps } from "./hero";
import { getLogo } from "./logo";
import type { OgImageSource } from "~/lib/og-image";

/**
 * The best available image to put on the site-level share card, in order:
 * the account's configured og:image, then the homepage hero photo, then the
 * logo. Most accounts configure none of the first, so before this fallback the
 * homepage shared with no thumbnail at all.
 *
 * Returns the raw source plus the fit to use — pass it to `ogImageEntry()` to
 * get the resized, WhatsApp-sized card.
 */
export async function getSiteOgImageSource(
  accountId?: bigint,
): Promise<OgImageSource> {
  const [seoConfig, heroProps, logoUrl] = await Promise.all([
    getSEOConfig(accountId),
    getHeroProps(accountId),
    getLogo(accountId),
  ]);

  const photo = seoConfig.ogImage?.trim() || heroProps?.backgroundImage?.trim();
  if (photo) return { url: photo, fit: "cover" };

  // Last resort: the logo, letterboxed so the wordmark survives.
  const logo = logoUrl?.trim();
  return logo ? { url: logo, fit: "contain" } : { url: null };
}
