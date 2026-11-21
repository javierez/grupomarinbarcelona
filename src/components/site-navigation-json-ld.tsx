// Sitelink hints for Google (SiteNavigationElement), copied from v1. v1 had it
// in the layout, on every page; here it goes on the home page only, next to
// the RealEstateAgent and WebSite JSON-LD, which is where Google reads it.
import { getSiteUrl } from "~/lib/site-url";
export default function SiteNavigationJsonLd() {
  const siteUrl = getSiteUrl();

  const items = [
    { name: "Pisos en venta", url: `${siteUrl}/venta-pisos/todas-ubicaciones` },
    { name: "Casas en venta", url: `${siteUrl}/venta-casas/todas-ubicaciones` },
    {
      name: "Locales en venta",
      url: `${siteUrl}/venta-locales/todas-ubicaciones`,
    },
    {
      name: "Terrenos en venta",
      url: `${siteUrl}/venta-solares/todas-ubicaciones`,
    },
    {
      name: "Garajes en venta",
      url: `${siteUrl}/venta-garajes/todas-ubicaciones`,
    },
    {
      name: "Pisos en alquiler",
      url: `${siteUrl}/alquiler-pisos/todas-ubicaciones`,
    },
    {
      name: "Casas en alquiler",
      url: `${siteUrl}/alquiler-casas/todas-ubicaciones`,
    },
    { name: "Vender tu propiedad", url: `${siteUrl}/vender` },
    { name: "Contacto", url: `${siteUrl}/contacto` },
    { name: "Preguntas Frecuentes", url: `${siteUrl}/faqs` },
  ];

  const jsonLd = items.map((item) => ({
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: item.name,
    url: item.url,
  }));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
