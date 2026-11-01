import { OfficesSection } from "~/components/offices-section";
import Footer from "~/components/footer";
import { PropertyGridContent } from "~/components/propertygrid/PropertyGridContent";
import { getHeroProps, getHeroCities } from "~/server/queries/hero";
import { getAboutProps } from "~/server/queries/about";
import { getContactProps } from "~/server/queries/contact";
import { getPromoCards } from "~/server/queries/promo-cards";
import { getPropertiesConfig } from "~/server/queries/website-config";
import { getListingsForGrid } from "~/server/queries/listings";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { getResolvedBannerSlides } from "~/server/queries/banner";
import { getColorProps } from "~/server/queries/color";
import { getFontProps } from "~/server/queries/font";
import { getFeaturesProps } from "~/server/queries/website-config";
import { getSocialLinks } from "~/server/queries/social";
import {
  getTestimonialProps,
  getTestimonials,
} from "~/server/queries/testimonial";
import { PreviewThemeClient } from "./preview-theme-client";
import { PreviewFooterText } from "./preview-footer-text";
import { PreviewSocialFamilySlot } from "./preview-features-client";
import { PreviewTestimonialsClient } from "./preview-testimonials-client";
import { PreviewHeroClient } from "./preview-hero-client";
import { PreviewPromoCardsClient } from "./preview-promo-cards-client";
import { PreviewPropertiesClient } from "./preview-properties-client";
import { PreviewAboutClient } from "./preview-about-client";
import { PreviewBannerClient } from "./preview-banner-client";
import { PreviewContactClient } from "./preview-contact-client";
import { PreviewSectionSync } from "./preview-section-sync";

/**
 * The real homepage, composed for an arbitrary account, with EVERY section
 * rendered as its live postMessage-driven version.
 *
 * All of them are live at once on purpose: the editor then keeps one iframe
 * for the whole homepage and merely scrolls between sections, instead of
 * reloading the page on every sidebar click.
 *
 * Mirrors `src/app/page.tsx` — same components, same order. Keep the two in
 * sync when the homepage gains or loses a section.
 */
export async function PreviewHome({
  accountId,
  section,
}: {
  accountId: bigint;
  section: string;
}) {
  const [
    heroProps,
    cities,
    promoCards,
    propertiesConfig,
    listings,
    watermark,
    aboutProps,
    contactProps,
    colorProps,
    fontProps,
    features,
    socialLinks,
    testimonialProps,
    testimonials,
    bannerSlides,
  ] = await Promise.all([
    getHeroProps(accountId),
    getHeroCities(accountId),
    getPromoCards(accountId),
    getPropertiesConfig(accountId),
    getListingsForGrid(12, accountId),
    getWatermarkConfig(accountId),
    getAboutProps(accountId),
    getContactProps(accountId),
    getColorProps(accountId),
    getFontProps(accountId),
    getFeaturesProps(accountId),
    getSocialLinks(accountId),
    getTestimonialProps(accountId),
    getTestimonials(accountId),
    getResolvedBannerSlides(accountId),
  ]);

  // Mirrors the gate in `src/app/page.tsx` — if the account has the section
  // switched off, the preview must not invent it. The gate itself now lives in
  // the client slot so the Funcionalidades tab can flip it, and which of the
  // two positions renders, without a reload.
  const socialFamilySlot = (position: "top" | "bottom") => (
    <PreviewSocialFamilySlot
      position={position}
      initialFeatures={features}
      initialLinks={socialLinks}
      fallbackEnabled={!!aboutProps?.showSocialFamilySection}
    />
  );

  return (
    <PreviewThemeClient initialColors={colorProps} initialFonts={fontProps}>
      <PreviewSectionSync initialSection={section} />
      <div className="relative">
        <div id="preview-hero">
          <PreviewHeroClient
            initialProps={heroProps}
            initialFeatures={features}
            cities={cities}
          />
        </div>

        {socialFamilySlot("top")}

        <div className="relative z-10 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div id="preview-banner">
              <PreviewBannerClient
                initialSlides={bannerSlides?.slides ?? []}
                initialIntervalMs={bannerSlides?.intervalMs ?? 5000}
              />
            </div>
            <div id="preview-promo-cards">
              <PreviewPromoCardsClient initialCards={promoCards} />
            </div>
            <OfficesSection accountId={accountId} />
            <div id="preview-properties">
              <PreviewPropertiesClient
                initialConfig={propertiesConfig}
                gridSlot={
                  <PropertyGridContent
                    listings={listings}
                    watermarkEnabled={watermark.enabled && !!watermark.logoUrl}
                  />
                }
              />
            </div>
            <div id="preview-about">
              <PreviewAboutClient initialProps={aboutProps} />
            </div>
            <div id="preview-testimonials">
              <PreviewTestimonialsClient
                initialProps={testimonialProps}
                testimonials={testimonials.map((t) => ({
                  id: String(t.testimonialId),
                  name: t.name ?? "",
                  role: t.role ?? "",
                  content: t.content ?? "",
                  avatar: t.avatar ?? undefined,
                  rating: t.rating ?? undefined,
                }))}
              />
            </div>
          </div>

          {socialFamilySlot("bottom")}

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div id="preview-contact">
              <PreviewContactClient initialProps={contactProps} />
            </div>
          </div>
        </div>
      </div>
      <div id="preview-footer">
        <Footer accountId={accountId} TextSlot={PreviewFooterText} />
      </div>
    </PreviewThemeClient>
  );
}
