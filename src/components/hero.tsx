import { getHeroProps, getHeroCities } from "../server/queries/hero";
import { getLogo } from "../server/queries/logo";
import { getFeaturesProps } from "../server/queries/website-config";
import { getHeroDirectButtons } from "../server/queries/promo-cards";
import { hrefForCard } from "~/server/promo-cards/href";
import { VENTA_HREF, ALQUILER_HREF } from "~/lib/listing-links";
import { HeroClient } from "./hero-client";

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

  // Blank is a real, saved value here ("use the default copy"), so it has to
  // become undefined rather than reach the input as an empty placeholder.
  const trimmedPlaceholder = features.heroSearchPlaceholder?.trim();
  const searchPlaceholder =
    trimmedPlaceholder === "" ? undefined : trimmedPlaceholder;

  // Fallbacks in case data is missing
  const title =
    heroProps?.title || "Encuentra Tu Propiedad Soñada";
  const subtitle =
    heroProps?.subtitle ||
    "Descubre propiedades excepcionales en ubicaciones privilegiadas. Permítenos guiarte en tu viaje inmobiliario.";
  const findPropertyButton =
    heroProps?.findPropertyButton || "Explorar Propiedades";
  const contactButton =
    features.menuLabels?.contacto || heroProps?.contactButton || "Contáctanos";
  const backgroundMedia = heroProps?.backgroundMedia;
  const backgroundType = heroProps?.backgroundType || "image";
  const backgroundVideo = heroProps?.backgroundVideo;
  const backgroundImage = heroProps?.backgroundImage;

  return (
    <HeroClient
      title={title}
      subtitle={subtitle}
      findPropertyButton={findPropertyButton}
      contactButton={contactButton}
      backgroundMedia={backgroundMedia}
      backgroundType={backgroundType}
      backgroundVideo={backgroundVideo}
      backgroundImage={backgroundImage}
      cities={cities}
      logoUrl={logoUrl}
      heroSize={features.heroSize ?? "standard"}
      heroDirectAccess={features.heroDirectAccess === true}
      directButtons={resolvedDirectButtons}
      searchPlaceholder={searchPlaceholder}
      overlayOpacity={features.heroOverlayOpacity ?? 0.35}
      topScrim={features.heroTopScrim === true}
    />
  );
}
