import type { ReactNode } from "react";
import { AboutSection } from "~/components/about-section";
import { CategoryPanel } from "~/components/category-panel";
import { ContactSection } from "~/components/contact-section";
import Footer from "~/components/footer";
import Hero from "~/components/hero";
import JsonLd from "~/components/json-ld";
import { OfficesSection } from "~/components/offices-section";
import PromoBanner from "~/components/promo-banner";
import { PropertyGrid } from "~/components/property-grid";
import SiteNavigationJsonLd from "~/components/site-navigation-json-ld";
import { familiaSocial, SocialFamilySection } from "~/components/social-family-section";
import { TestimonialsSection } from "~/components/testimonials/TestimonialsSection";
import { CtaBand } from "~/components/v3/cta-band";
import { HomeVideoReels } from "~/components/video/home-video-reels";
import WebsiteJsonLd from "~/components/website-json-ld";
import { hrefForCard } from "~/server/promo-cards/href";
import { getPromoCards } from "~/server/queries/promo-cards";
import { getFeaturesProps } from "~/server/queries/website-config";

/** Las secciones que la vista previa del CRM sigue en directo. */
export type PiezaEnDirecto =
  | "hero"
  | "banner"
  | "promo-cards"
  | "properties"
  | "about"
  | "testimonials"
  | "contact"
  | "footer";

/**
 * La portada: qué secciones salen, en qué orden y con qué interruptores. UNA
 * sola para la web (`app/page.tsx`) y la vista previa de «Mi web» en el CRM
 * (`app/preview/[section]/preview-home.tsx`).
 *
 * La vista previa tenía su propia copia de esta lista y se fue quedando atrás:
 * sin la portada editorial, sin la v3, sin «Recorridos en vídeo», con tarjetas
 * que la web tenía apagadas. El 17-nov-2026 14 de 17 agencias veían en el
 * editor otra portada que su web (Sergio, Muñoz Espasande). Ahora la vista
 * previa solo cambia QUÉ pinta cada sección (su versión en directo, que pinta
 * el mismo componente que la web), nunca si sale ni dónde.
 * `src/app/preview/vista-previa-guard.test.ts` falla si vuelve una copia.
 */
export async function Portada({
  accountId,
  previa,
}: {
  /** Sin ella, la cuenta del despliegue. */
  accountId?: bigint;
  /** Solo la vista previa: la versión en directo de cada sección. */
  previa?: {
    piezas: Record<PiezaEnDirecto, ReactNode>;
    /** «Sé uno más de la familia» en directo, que decide él si sale y dónde. */
    social: { arriba: ReactNode; abajo: ReactNode };
  };
}) {
  const [features, promoCards, familia] = await Promise.all([
    getFeaturesProps(accountId),
    getPromoCards(accountId),
    familiaSocial(accountId),
  ]);

  // En la vista previa, cada sección es su versión en directo dentro de su
  // ancla (`preview-sections.ts`), para que el editor salte a ella.
  const pieza = (id: PiezaEnDirecto, web: ReactNode) =>
    previa ? <div id={`preview-${id}`}>{previa.piezas[id]}</div> : web;

  // Explicit flag wins; otherwise the about flag / account 129.
  const showSocialFamilySection = features.sections?.socialFamily ?? familia.porDefecto;
  // Default position keeps the historical behavior (right below the hero).
  const socialFamilyAtBottom = features.sections?.socialFamilyPosition === "bottom";
  const social = (abajo: boolean) => {
    if (previa) return abajo ? previa.social.abajo : previa.social.arriba;
    if (!showSocialFamilySection || socialFamilyAtBottom !== abajo) return null;
    return (
      <SocialFamilySection
        accountId={accountId}
        links={familia.links}
        subtitle={features.sections?.socialFamilySubtitle}
        platforms={features.sections?.socialFamilyPlatforms}
      />
    );
  };

  return (
    <>
      <div className="relative">
        {!previa && (
          <>
            <JsonLd />
            <WebsiteJsonLd />
            <SiteNavigationJsonLd />
          </>
        )}
        {pieza("hero", <Hero accountId={accountId} />)}

        {social(false)}

        <div className="relative z-10 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Hidden (kind: "none") unless configured via banner_props. */}
            {pieza("banner", <PromoBanner accountId={accountId} />)}
            {features.sections?.categories !== false &&
              pieza(
                "promo-cards",
                <CategoryPanel
                  promotionsEnabled={features.pages?.promociones === true}
                  cards={promoCards.map((c) => ({
                    title: c.title,
                    subtitle: c.subtitle,
                    href: hrefForCard(c),
                    imageUrl: c.imageUrl,
                  }))}
                  menuLabels={features.menuLabels}
                />,
              )}
            {/* "Recorridos en vídeo" — only when enabled in features_props.video. */}
            <HomeVideoReels accountId={accountId} />
            {/* Office picker — renders only for account 141 (Grupo Marín). */}
            <OfficesSection accountId={accountId} />
            {pieza("properties", <PropertyGrid accountId={accountId} />)}
            <CtaBand band={features.ctaBand} />
            {(features.sections?.about ?? true) &&
              pieza("about", <AboutSection accountId={accountId} />)}
            {/* Opiniones — renders only when the account enabled it in the CRM */}
            {pieza("testimonials", <TestimonialsSection accountId={accountId} />)}
          </div>

          {social(true)}

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {pieza("contact", <ContactSection accountId={accountId} />)}
          </div>
        </div>
      </div>
      {pieza("footer", <Footer accountId={accountId} />)}
    </>
  );
}
