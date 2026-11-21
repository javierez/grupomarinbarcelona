import { getHeroProps, getHeroCities } from "../server/queries/hero";
import { getLogo } from "../server/queries/logo";
import { getFeaturesProps } from "../server/queries/website-config";
import { getHeroDirectButtons } from "../server/queries/promo-cards";
import { hrefForCard } from "~/server/promo-cards/href";
import { VENTA_HREF, ALQUILER_HREF } from "~/lib/listing-links";
import { getColorProps } from "../server/queries/color";
import { HeroPorEstilo } from "./hero-por-estilo";
import { PropertySearchWrapper } from "./property-search-wrapper";

/** What the templates hardcoded before the buttons became configurable. */
const DEFAULT_DIRECT_BUTTONS = [
  { label: "Venta", href: VENTA_HREF },
  { label: "Alquiler", href: ALQUILER_HREF },
];

export default async function Hero({ accountId }: { accountId?: bigint } = {}) {
  const [heroProps, cities, logoUrl, features, directButtons] =
    await Promise.all([
      getHeroProps(accountId),
      getHeroCities(accountId),
      getLogo(accountId),
      getFeaturesProps(accountId),
      getHeroDirectButtons(accountId),
    ]);

  // Resolved here rather than in the client so the destination logic stays in
  // one place, shared with the promo cards.
  const resolvedDirectButtons =
    directButtons.length > 0
      ? directButtons.map((b) => ({ label: b.label, href: hrefForCard(b) }))
      : DEFAULT_DIRECT_BUTTONS;

  // El color solo lo pide la portada editorial.
  const brandColor =
    features.siteStyle === "editorial" && features.heroStyle !== "v3"
      ? (await getColorProps(accountId))?.primaryColor
      : undefined;

  return (
    <HeroPorEstilo
      hero={heroProps}
      features={features}
      cities={cities}
      logoUrl={logoUrl}
      brandColor={brandColor}
      directButtons={resolvedDirectButtons}
      fullSearch={
        // Solo si se usa: montarlo de más lanzaría sus consultas igual.
        heroProps?.buscador === "completo" ? (
          <PropertySearchWrapper accountId={accountId} />
        ) : undefined
      }
    />
  );
}
