/**
 * Editor sections that all live on the homepage. They share ONE preview URL
 * (`/preview/home`), so switching between them in the editor scrolls the
 * existing page instead of reloading the iframe.
 */
export const IN_PAGE_SECTIONS = [
  "hero",
  "colors",
  "fonts",
  "banner",
  "promo-cards",
  "properties",
  "watermark",
  "about",
  "testimonials",
  "contact",
  "social",
  "footer",
  "funcionalidades",
] as const;

export type InPageSection = (typeof IN_PAGE_SECTIONS)[number];

export function isInPageSection(section: string): section is InPageSection {
  return (IN_PAGE_SECTIONS as readonly string[]).includes(section);
}

/** Anchor the editor scrolls to and outlines, per section. */
export const SECTION_ANCHORS: Record<string, string> = {
  hero: "preview-hero",
  colors: "preview-hero",
  fonts: "preview-hero",
  // Flags restructure the whole page; the hero is where most of them show.
  funcionalidades: "preview-hero",
  banner: "preview-banner",
  "promo-cards": "preview-promo-cards",
  properties: "preview-properties",
  watermark: "preview-properties",
  about: "preview-about",
  testimonials: "preview-testimonials",
  contact: "preview-contact",
  // Its own section now that the homepage renders the "familia" cards. Falls
  // back to nothing if the account has it switched off, which is correct —
  // there is no element to scroll to.
  social: "preview-social",
  footer: "preview-footer",
};
