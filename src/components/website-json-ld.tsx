import { getSEOConfig } from "~/server/queries/website-config";
import { getSiteUrl } from "~/lib/site-url";

export default async function WebsiteJsonLd() {
  const seoConfig = await getSEOConfig();
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}#website`,
    name: seoConfig.ogSiteName || seoConfig.name || "Inmobiliaria",
    url: siteUrl,
    inLanguage: "es-ES",
    publisher: { "@id": `${siteUrl}#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/venta-propiedades/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
