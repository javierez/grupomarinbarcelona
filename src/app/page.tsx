import { Portada } from "~/components/portada";
import type { Metadata } from "next";
import { getMetadataProps } from "~/server/queries/meta";
import { getSEOConfig } from "~/server/queries/website-config";
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

export default function Home() {
  return <Portada />;
}
