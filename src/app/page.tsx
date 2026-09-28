import { PropertyGrid } from "~/components/property-grid";
import Hero from "~/components/hero";
import { ContactSection } from "~/components/contact-section";
import { AboutSection } from "~/components/about-section";
import { TestimonialsSection } from "~/components/testimonials/TestimonialsSection";
import { CategoryPanel, type CategoryPanelCardInput } from "~/components/category-panel";
import { getPromoCards } from "~/server/queries/promo-cards";
import { hrefForCard } from "~/server/promo-cards/href";
import JsonLd from "~/components/json-ld";
import WebsiteJsonLd from "~/components/website-json-ld";
import Footer from "~/components/footer";
import PromoBanner from "~/components/promo-banner";
import type { Metadata } from "next";
import { getMetadataProps } from "~/server/queries/meta";
import { getFeaturesProps, getSEOConfig } from "~/server/queries/website-config";
import { getSocialLinks } from "~/server/queries/social";
import { getAboutProps } from "~/server/queries/about";
import { SocialFamilySection } from "~/components/social-family-section";
import { OfficesSection } from "~/components/offices-section";
import { ACCOUNT_129_SOCIAL_LINKS } from "~/lib/account-overrides/129";
import type { SocialLink } from "~/components/ui/social-links";
import { getSiteUrl } from "~/lib/site-url";
import { ogImageEntry } from "~/lib/og-image";
import { getSiteOgImageSource } from "~/server/queries/og-image";

// Regenerate the page every 5 minutes with fresh data from the database
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const [metadataProps, seoConfig, ogImageSource] = await Promise.all([
    getMetadataProps(),
    getSEOConfig(),
    getSiteOgImageSource(),
  ]);

  // Extract mainpage metadata if it exists
  const mainpageData = metadataProps?.mainpage;
  const siteUrl = getSiteUrl();

  // Most accounts leave `metadata.mainpage` empty and maintain `seo_props`
  // instead. Fall back to the SEO config (the brand title/description/keywords)
  // before the generic placeholders so the homepage exposes a real, on-brand
  // meta description to Google rather than a useless default it ignores.
  const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: mainpageData?.title || seoConfig.title || "Casas y pisos, alquiler y venta",
    description:
      mainpageData?.description ||
      seoConfig.description ||
      "¿Buscas casa? Pisos y casas en venta o alquiler.",
    keywords: mainpageData?.keywords || seoConfig.keywords || [],
    alternates: {
      canonical: siteUrl,
    },
  };

  // Allow DB config to override canonical/alternates
  if (mainpageData?.alternates) {
    metadata.alternates = mainpageData.alternates;
  }

  // Handle OpenGraph with proper typing
  if (mainpageData?.openGraph) {
    const ogAlt = seoConfig.ogSiteName || seoConfig.name || "Inmobiliaria";
    const ogImages = (mainpageData.openGraph.images ?? [])
      .filter((img: any) => img.url)
      .map((img: any) => ogImageEntry(img.url, img.alt || ogAlt));

    metadata.openGraph = {
      title: mainpageData.openGraph.title,
      description: mainpageData.openGraph.description,
      type: (mainpageData.openGraph.type as any) || 'website',
      locale: mainpageData.openGraph.locale,
      siteName: mainpageData.openGraph.siteName,
      // Defining openGraph here replaces the layout's entirely, so an empty
      // images list would silently drop the share thumbnail.
      images: ogImages.length > 0 ? ogImages : [ogImageEntry(ogImageSource, ogAlt)],
    };
  }

  // Handle Twitter metadata
  if (mainpageData?.twitter) {
    metadata.twitter = {
      card: (mainpageData.twitter.card as any) || 'summary_large_image',
      title: mainpageData.twitter.title,
      description: mainpageData.twitter.description,
      images: [ogImageEntry(ogImageSource, seoConfig.ogSiteName || seoConfig.name || "Inmobiliaria")],
    };
  }

  // Handle robots with proper boolean typing
  if (mainpageData?.robots) {
    const robotsIndex = typeof mainpageData.robots.index === 'number' 
      ? mainpageData.robots.index === 1 
      : mainpageData.robots.index === true;
    
    const robotsFollow = typeof mainpageData.robots.follow === 'number'
      ? mainpageData.robots.follow === 1
      : mainpageData.robots.follow === true;

    metadata.robots = {
      index: robotsIndex,
      follow: robotsFollow,
    };

    if (mainpageData.robots.googleBot) {
      const googleBotIndex = typeof mainpageData.robots.googleBot.index === 'number'
        ? mainpageData.robots.googleBot.index === 1
        : mainpageData.robots.googleBot.index === true;
      
      const googleBotFollow = typeof mainpageData.robots.googleBot.follow === 'number'
        ? mainpageData.robots.googleBot.follow === 1
        : mainpageData.robots.googleBot.follow === true;

      metadata.robots.googleBot = {
        index: googleBotIndex,
        follow: googleBotFollow,
        'max-image-preview': mainpageData.robots.googleBot['max-image-preview'] as any,
        'max-snippet': mainpageData.robots.googleBot['max-snippet'],
      };
    }
  }

  return metadata;
}

export default async function Home() {
  const features = await getFeaturesProps();
  const promotionsEnabled = features.pages?.promociones === true;
  const promoCards = await getPromoCards();
  const aboutProps = await getAboutProps();
  const isAccount129 = process.env.NEXT_PUBLIC_ACCOUNT_ID === "129";
  // Explicit flag wins; otherwise preserve prior behavior (about flag / account 129).
  const showSocialFamilySection =
    features.sections?.socialFamily ??
    (!!aboutProps?.showSocialFamilySection || isAccount129);
  // For account 129: hardcoded social links (immune to DB edits and to the
  // generate-site preprocessor stripping "unused" variables).
  // For other accounts: read from the DB at request time.
  const socialFamilyLinks: SocialLink[] = isAccount129
    ? ACCOUNT_129_SOCIAL_LINKS
    : await getSocialLinks();
  // Default position keeps the historical behavior (right below the hero).
  const socialFamilyAtBottom = features.sections?.socialFamilyPosition === "bottom";
  // Show the homepage "Sobre Nosotros" section unless explicitly disabled.
  const showAboutSection = features.sections?.about ?? true;
  const categoryCards: CategoryPanelCardInput[] = promoCards.map((c) => ({
    title: c.title,
    subtitle: c.subtitle,
    href: hrefForCard(c),
    imageUrl: c.imageUrl,
  }));
  return (
    <>
      <div className="relative">
        {/* Hero Section - background, title and search handled by Hero component */}
        <JsonLd />
        <WebsiteJsonLd />
        <Hero />

        {/* Social media family section — gated per-account via about_props.showSocialFamilySection.
            Rendered here (below the hero) unless features.sections.socialFamilyPosition = "bottom". */}
        {showSocialFamilySection && !socialFamilyAtBottom && (
          <SocialFamilySection
            links={socialFamilyLinks}
            subtitle={features.sections?.socialFamilySubtitle}
            platforms={features.sections?.socialFamilyPlatforms}
          />
        )}

        {/* Main Content */}
        <div className="relative z-10 bg-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Promotional banner — first content element below hero/search.
                Hidden (kind: "none") for every account unless configured via
                website_config.banner_props. */}
            <PromoBanner />
            <CategoryPanel
              promotionsEnabled={promotionsEnabled}
              cards={categoryCards}
              menuLabels={features.menuLabels}
            />
            {/* Office picker — renders only for account 141 (Grupo Marín). */}
            <OfficesSection />
            <PropertyGrid />
            {showAboutSection && <AboutSection />}
            {/* Opiniones — renders only when the account enabled it in the CRM */}
            <TestimonialsSection />
          </div>

          {/* Social family section at the bottom, just above Contacto. */}
          {showSocialFamilySection && socialFamilyAtBottom && (
            <SocialFamilySection
              links={socialFamilyLinks}
              subtitle={features.sections?.socialFamilySubtitle}
              platforms={features.sections?.socialFamilyPlatforms}
            />
          )}

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ContactSection />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
