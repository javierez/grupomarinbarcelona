import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ACCOUNT_139_SECTION_PADDING } from "~/lib/account-overrides/139";
import type { ResolvedVideoFeatures } from "~/lib/video-features";
import type { ListingCardData } from "~/server/queries/listings";
import type {
  FeaturesProps,
  PropertiesConfig,
} from "~/server/queries/website-config";
import { PropertyGridV3 } from "../v3/property-grid-v3";
import { FeaturedFeedButton } from "./FeaturedFeedButton";
import { PropertyButton } from "./PropertyButton";
import { PropertyGridContent } from "./PropertyGridContent";
import { PropertyGridWrapper } from "./PropertyGridWrapper";
import { PropertyHeader } from "./PropertyHeader";

/**
 * «Propiedades destacadas» de la portada, ya con sus datos. La pintan la web
 * (`property-grid.tsx`) y la vista previa del CRM: la vista previa tenía su
 * copia sin la v3 ni el botón del feed, y 1, 158 y 224 veían en el editor otra
 * sección que en su web (17-nov-2026).
 */
export function Destacados({
  listings,
  config,
  watermarkEnabled,
  features,
  video,
  tight = false,
}: {
  /** Las 12 de la portada; la rejilla corta las suyas, el feed las usa todas. */
  listings: ListingCardData[];
  config: PropertiesConfig;
  watermarkEnabled: boolean;
  features: FeaturesProps;
  video: ResolvedVideoFeatures;
  /** Los márgenes cortos de la 139. */
  tight?: boolean;
}) {
  const { title, subtitle, buttonText, showDescription, showReference, cardDisplay } = config;

  // "feed" turns the section into a teaser: a short grid whose button opens the
  // full-screen vertical property feed over the page. Default keeps the full
  // grid and a button that navigates to the search results.
  const isFeedMode = features.featuredMode === "feed";
  const gridCount = features.featuredGridCount ?? (isFeedMode ? 3 : listings.length);
  const gridListings = listings.slice(0, gridCount);

  // Version 3: a quiet centred title, the staggered photo cards and a centred
  // pill button. The subtitle is left out on purpose — the title says it all.
  if (features.propertiesStyle === "v3") {
    return (
      <section className="py-24 sm:py-28 lg:py-32" id="properties" data-vesta="destacados">
        <div className="container">
          <h2 data-vesta="destacados.titulo" className="mb-14 text-center text-[clamp(26px,3vw,32px)] font-light text-muted-foreground sm:mb-20">
            {title}
          </h2>
          <PropertyGridV3 listings={gridListings} watermarkEnabled={watermarkEnabled} />
          {listings.length > 0 && (
            <div className="mt-16 flex justify-center sm:mt-20">
              <Button size="pill" asChild data-vesta="destacados.boton">
                <Link href="/venta-propiedades/todas-ubicaciones">{buttonText}</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <PropertyGridWrapper>
      <section
        className={
          tight
            ? ACCOUNT_139_SECTION_PADDING
            : features.aspectoV1 === true
              ? "pb-4 pt-16 sm:pb-8 lg:pb-12"
              : "py-24 sm:py-28 lg:py-32"
        }
        id="properties"
        data-vesta="destacados"
      >
        <div className="container">
          <PropertyHeader
            title={title}
            subtitle={subtitle}
            vesta={{ titulo: "destacados.titulo", subtitulo: "destacados.subtitulo" }}
          />
          <PropertyGridContent listings={gridListings} watermarkEnabled={watermarkEnabled} showDescription={showDescription} showReference={showReference} cardDisplay={cardDisplay} video={{ badge: video.cardBadge, preview: video.cardPreview }} />
          {listings.length > 0 &&
            (isFeedMode ? (
              <FeaturedFeedButton
                text={buttonText}
                listings={listings}
                watermarkEnabled={watermarkEnabled}
                video={video}
              />
            ) : (
              <PropertyButton text={buttonText} />
            ))}
        </div>
      </section>
    </PropertyGridWrapper>
  );
}
