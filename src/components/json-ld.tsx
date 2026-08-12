import { getSeoProps } from "~/server/queries/jsonLd";

export default async function JsonLd() {
  const seoProps = await getSeoProps();
  if (!seoProps) return null;

  const siteUrl =
    seoProps.url ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": `${siteUrl}#organization`,
    name: seoProps.name,
    description: seoProps.description,
    url: seoProps.url,
    telephone: seoProps.telephone,
    email: seoProps.email,
    keywords: seoProps.keywords,
  };

  // Add optional fields only if they exist
  if (seoProps.image) {
    jsonLd.image = seoProps.image;
  }

  if (seoProps.ogImage) {
    jsonLd.ogImage = seoProps.ogImage;
  }

  if (seoProps.address) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: seoProps.address.streetAddress,
      addressLocality: seoProps.address.addressLocality,
      addressRegion: seoProps.address.addressRegion,
      postalCode: seoProps.address.postalCode,
      addressCountry: seoProps.address.addressCountry,
    };
  }

  if (seoProps.geo) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: seoProps.geo.latitude,
      longitude: seoProps.geo.longitude,
    };
  }

  if (seoProps.openingHoursSpecification) {
    jsonLd.openingHoursSpecification = seoProps.openingHoursSpecification.map(
      (spec) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: spec.dayOfWeek,
        opens: spec.opens,
        closes: spec.closes,
      }),
    );
  }

  if (seoProps.priceRange) {
    jsonLd.priceRange = seoProps.priceRange;
  }

  if (seoProps.areaServed) {
    jsonLd.areaServed = {
      "@type": "City",
      name: seoProps.areaServed.name,
      sameAs: seoProps.areaServed.sameAs,
    };
  }

  if (seoProps.hasOfferCatalog) {
    jsonLd.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: seoProps.hasOfferCatalog.name,
      itemListElement: seoProps.hasOfferCatalog.itemListElement.map((item) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: item.name,
          description: item.description,
        },
      })),
    };
  }

  if (seoProps.sameAs) {
    jsonLd.sameAs = seoProps.sameAs;
  }

  if (seoProps.aggregateRating) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: seoProps.aggregateRating.ratingValue,
      reviewCount: seoProps.aggregateRating.reviewCount,
      bestRating: seoProps.aggregateRating.bestRating,
      worstRating: seoProps.aggregateRating.worstRating,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
