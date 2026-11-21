import { Portada } from "~/components/portada";
import Footer from "~/components/footer";
import { PropertySearchWrapper } from "~/components/property-search-wrapper";
import { familiaSocial } from "~/components/social-family-section";
import { aOpiniones } from "~/components/testimonials/TestimonialsSection";
import { isAccount139 } from "~/lib/account-overrides/139";
import { getAboutProps } from "~/server/queries/about";
import { getResolvedBannerSlides } from "~/server/queries/banner";
import { getColorProps } from "~/server/queries/color";
import { getContactProps } from "~/server/queries/contact";
import { getFontProps } from "~/server/queries/font";
import { getHeroCities, getHeroProps } from "~/server/queries/hero";
import { getListingsForGrid } from "~/server/queries/listings";
import { getLogo } from "~/server/queries/logo";
import { getPromoCards } from "~/server/queries/promo-cards";
import { getSocialLinks } from "~/server/queries/social";
import {
  getTestimonialProps,
  getTestimonials,
} from "~/server/queries/testimonial";
import { getWatermarkConfig } from "~/server/queries/watermark";
import {
  getFeaturesProps,
  getPropertiesConfig,
  getVideoFeatures,
} from "~/server/queries/website-config";
import { PreviewAboutClient } from "./preview-about-client";
import { PreviewBannerClient } from "./preview-banner-client";
import { PreviewContactClient } from "./preview-contact-client";
import { PreviewSocialFamilySlot } from "./preview-features-client";
import { PreviewFooterText } from "./preview-footer-text";
import { PreviewHeroClient } from "./preview-hero-client";
import { PreviewPromoCardsClient } from "./preview-promo-cards-client";
import { PreviewPropertiesClient } from "./preview-properties-client";
import { PreviewSectionSync } from "./preview-section-sync";
import { PreviewTestimonialsClient } from "./preview-testimonials-client";
import { PreviewThemeClient } from "./preview-theme-client";

/**
 * La portada de una agencia en «Mi web» del CRM: la MISMA `Portada` que su web
 * (qué secciones, en qué orden, con qué interruptores), con cada sección que el
 * editor cambia en su versión en directo, que pinta el mismo componente que la
 * web con los datos que llegan por postMessage.
 *
 * Todas en directo a la vez: el editor guarda un solo iframe para la portada y
 * solo se desplaza entre secciones, sin recargar en cada clic.
 *
 * Aquí no se decide si una sección sale ni dónde: eso es de `Portada`
 * (`vista-previa-guard.test.ts`).
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
    familia,
    testimonialProps,
    testimonials,
    bannerSlides,
    logoUrl,
    video,
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
    familiaSocial(accountId),
    getTestimonialProps(accountId),
    getTestimonials(accountId),
    getResolvedBannerSlides(accountId),
    getLogo(accountId),
    getVideoFeatures(accountId),
  ]);

  // Rendered at both positions; each copy decides live whether it is the one
  // that shows, with the same rule as `Portada`.
  const socialFamilySlot = (position: "top" | "bottom") => (
    <PreviewSocialFamilySlot
      position={position}
      initialFeatures={features}
      initialLinks={familia.links}
      fallbackEnabled={familia.porDefecto}
    />
  );

  return (
    <PreviewThemeClient initialColors={colorProps} initialFonts={fontProps}>
      <PreviewSectionSync initialSection={section} />
      <Portada
        accountId={accountId}
        previa={{
          social: { arriba: socialFamilySlot("top"), abajo: socialFamilySlot("bottom") },
          piezas: {
            hero: (
              <PreviewHeroClient
                initialProps={heroProps}
                initialFeatures={features}
                cities={cities}
                logoUrl={logoUrl}
                brandColor={colorProps?.primaryColor}
                fullSearch={
                  heroProps?.buscador === "completo" ? (
                    <PropertySearchWrapper accountId={accountId} />
                  ) : undefined
                }
              />
            ),
            banner: (
              <PreviewBannerClient
                initialSlides={bannerSlides?.slides ?? []}
                initialIntervalMs={bannerSlides?.intervalMs ?? 5000}
                botonMarca={features.bannerBotonMarca === true}
              />
            ),
            "promo-cards": (
              <PreviewPromoCardsClient
                initialCards={promoCards}
                promotionsEnabled={features.pages?.promociones === true}
                menuLabels={features.menuLabels}
              />
            ),
            properties: (
              <PreviewPropertiesClient
                initialConfig={propertiesConfig}
                listings={listings}
                watermarkEnabled={watermark.enabled && !!watermark.logoUrl}
                features={features}
                video={video}
                tight={isAccount139(accountId)}
              />
            ),
            about: (
              <PreviewAboutClient
                initialProps={aboutProps}
                features={features}
                accountId={accountId.toString()}
              />
            ),
            testimonials: (
              <PreviewTestimonialsClient
                initialProps={testimonialProps}
                testimonials={aOpiniones(testimonials)}
              />
            ),
            contact: (
              <PreviewContactClient
                initialProps={contactProps}
                socialLinks={socialLinks}
                features={features}
                brandColor={colorProps?.primaryColor}
              />
            ),
            footer: <Footer accountId={accountId} TextSlot={PreviewFooterText} />,
          },
        }}
      />
    </PreviewThemeClient>
  );
}
