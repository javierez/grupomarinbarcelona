import { getSeoProps } from "~/server/queries/jsonLd";
import { getContactProps } from "~/server/queries/contact";
import { getSiteUrl } from "~/lib/site-url";

/** First value that is a non-blank string ("" in seo_props counts as unset). */
function firstFilled(...values: (string | null | undefined)[]): string | undefined {
  return values.find((v): v is string => typeof v === "string" && v.trim() !== "");
}

export default async function JsonLd() {
  const [seoProps, contactProps] = await Promise.all([
    getSeoProps(),
    getContactProps(),
  ]);
  if (!seoProps) return null;

  const siteUrl =
    seoProps.url ?? getSiteUrl();

  // Without a phone/email in seo_props, the default office's (as in v1): it is
  // what feeds the call button in Google's business panel.
  const defaultOffice =
    contactProps?.offices?.find((o) => o.isDefault) ?? contactProps?.offices?.[0];
  const telephone = firstFilled(
    seoProps.telephone,
    defaultOffice?.phoneNumbers?.sales,
    defaultOffice?.phoneNumbers?.main,
  );
  const email = firstFilled(
    seoProps.email,
    defaultOffice?.emailAddresses?.info,
    defaultOffice?.emailAddresses?.sales,
  );

  const jsonLd: any = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "LocalBusiness"],
    "@id": `${siteUrl}#organization`,
    name: seoProps.name,
    description: seoProps.description,
    url: seoProps.url,
    telephone,
    email,
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
