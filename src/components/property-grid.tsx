import { getListingsForGrid } from "~/server/queries/listings";
import {
  getFeaturesProps,
  getPropertiesConfig,
  getVideoFeatures,
} from "~/server/queries/website-config";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { PropertyHeader } from "./propertygrid/PropertyHeader";
import { PropertyGridContent } from "./propertygrid/PropertyGridContent";
import { PropertyButton } from "./propertygrid/PropertyButton";
import { FeaturedFeedButton } from "./propertygrid/FeaturedFeedButton";
import { PropertyGridWrapper } from "./propertygrid/PropertyGridWrapper";
import { PropertyGridV3 } from "./v3/property-grid-v3";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import {
  isAccount139,
  ACCOUNT_139_SECTION_PADDING,
} from "~/lib/account-overrides/139";

export async function PropertyGrid({ accountId }: { accountId?: bigint } = {}) {
  // Fetch listings and configuration data from the database
  const [listings, config, watermarkConfig, features, videoFeatures] = await Promise.all([
    getListingsForGrid(12, accountId),
    getPropertiesConfig(accountId),
    getWatermarkConfig(accountId),
    getFeaturesProps(accountId),
    getVideoFeatures(accountId),
  ]);

  const { title, subtitle, buttonText, showDescription, showReference, cardDisplay } = config;
  const watermarkEnabled = watermarkConfig.enabled && !!watermarkConfig.logoUrl;

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
      <section className="py-24 sm:py-28 lg:py-32" id="properties">
        <div className="container">
          <h2 className="mb-14 text-center text-[clamp(26px,3vw,32px)] font-light text-muted-foreground sm:mb-20">
            {title}
          </h2>
          <PropertyGridV3 listings={gridListings} watermarkEnabled={watermarkEnabled} />
          {listings.length > 0 && (
            <div className="mt-16 flex justify-center sm:mt-20">
              <Button size="pill" asChild>
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
        className={isAccount139() ? ACCOUNT_139_SECTION_PADDING : "py-24 sm:py-28 lg:py-32"}
        id="properties"
      >
        <div className="container">
          <PropertyHeader title={title} subtitle={subtitle} />
          <PropertyGridContent listings={gridListings} watermarkEnabled={watermarkEnabled} showDescription={showDescription} showReference={showReference} cardDisplay={cardDisplay} video={{ badge: videoFeatures.cardBadge, preview: videoFeatures.cardPreview }} />
          {listings.length > 0 &&
            (isFeedMode ? (
              <FeaturedFeedButton
                text={buttonText}
                listings={listings}
                watermarkEnabled={watermarkEnabled}
                video={videoFeatures}
              />
            ) : (
              <PropertyButton text={buttonText} />
            ))}
        </div>
      </section>
    </PropertyGridWrapper>
  );
}
