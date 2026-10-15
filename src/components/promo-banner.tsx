import { getResolvedBannerSlides } from "~/server/queries/banner";
import { BannerCarousel } from "~/components/banner-carousel";

/**
 * Big homepage banner rendered as the first content element, below the hero and
 * search bar. Driven by `website_config.banner_props` (see getResolvedBannerSlides).
 * Renders nothing when the account's banner is "none" (the default), so it is
 * inert for every account until explicitly configured. The "promotions" kind
 * resolves to multiple slides that the carousel rotates through.
 */
export default async function PromoBanner({ accountId }: { accountId?: bigint } = {}) {
  const resolved = await getResolvedBannerSlides(accountId);
  if (!resolved) return null;

  return (
    <BannerCarousel slides={resolved.slides} intervalMs={resolved.intervalMs} />
  );
}
