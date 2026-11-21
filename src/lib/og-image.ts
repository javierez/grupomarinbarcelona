import { getSiteUrl } from "~/lib/site-url";

/** The 1.91:1 card every scraper expects; must match /api/og's output. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/**
 * Absolute og:image URL for a source photo, routed through /api/og so the
 * bytes are resized and compressed to what WhatsApp will actually render.
 *
 * Scrapers do not resolve relative URLs reliably and never send cookies, so the
 * result is always absolute and always publicly fetchable. Returns the neutral
 * placeholder card when the account has no usable image configured.
 */
export function ogImageUrl(
  src: string | null | undefined,
  fit: "cover" | "contain" = "cover",
): string {
  const base = getSiteUrl();
  const trimmed = src?.trim();
  if (!trimmed) return `${base}/api/og`;

  // Site-relative assets (e.g. "/properties/foo.png") are already small and
  // served from our own origin; just make them absolute.
  if (trimmed.startsWith("/")) return `${base}${trimmed}`;

  const fitParam = fit === "contain" ? "&fit=contain" : "";
  return `${base}/api/og?src=${encodeURIComponent(trimmed)}${fitParam}`;
}

/** A source image plus how it should be fitted into the 1.91:1 card. */
export type OgImageSource = { url: string | null; fit?: "cover" | "contain" };

/** The `openGraph.images` entry for a source photo, with honest dimensions. */
export function ogImageEntry(
  src: string | null | undefined | OgImageSource,
  alt: string,
) {
  const { url, fit } =
    typeof src === "string" || src == null ? { url: src, fit: undefined } : src;
  return {
    url: ogImageUrl(url, fit),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt,
  };
}
