import { getListingsForGrid } from "~/server/queries/listings";
import {
  getFeaturesProps,
  getPropertiesConfig,
} from "~/server/queries/website-config";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { PropertyHeader } from "./propertygrid/PropertyHeader";
import { PropertyGridContent } from "./propertygrid/PropertyGridContent";
import { PropertyButton } from "./propertygrid/PropertyButton";
import { FeaturedFeedButton } from "./propertygrid/FeaturedFeedButton";
import { PropertyGridWrapper } from "./propertygrid/PropertyGridWrapper";
import {
  isAccount139,
  ACCOUNT_139_SECTION_PADDING,
} from "~/lib/account-overrides/139";

export async function PropertyGrid({ accountId }: { accountId?: bigint } = {}) {
  // Fetch listings and configuration data from the database
  const [listings, config, watermarkConfig, features] = await Promise.all([
    getListingsForGrid(12, accountId),
    getPropertiesConfig(accountId),
    getWatermarkConfig(accountId),
    getFeaturesProps(accountId),
  ]);

  const { title, subtitle, buttonText, showDescription, showReference, cardDisplay } = config;
  const watermarkEnabled = watermarkConfig.enabled && !!watermarkConfig.logoUrl;

  // "feed" turns the section into a teaser: a short grid whose button opens the
  // full-screen vertical property feed over the page. Default keeps the full
  // grid and a button that navigates to the search results.
  const isFeedMode = features.featuredMode === "feed";
  const gridCount = features.featuredGridCount ?? (isFeedMode ? 3 : listings.length);
  const gridListings = listings.slice(0, gridCount);

  return (
    <PropertyGridWrapper>
      <section
        className={isAccount139() ? ACCOUNT_139_SECTION_PADDING : "py-24 sm:py-28 lg:py-32"}
        id="properties"
      >
        <div className="container">
          <PropertyHeader title={title} subtitle={subtitle} />
          <PropertyGridContent listings={gridListings} watermarkEnabled={watermarkEnabled} showDescription={showDescription} showReference={showReference} cardDisplay={cardDisplay} />
          {listings.length > 0 &&
            (isFeedMode ? (
              <FeaturedFeedButton
                text={buttonText}
                listings={listings}
                watermarkEnabled={watermarkEnabled}
              />
            ) : (
              <PropertyButton text={buttonText} />
            ))}
        </div>
      </section>
    </PropertyGridWrapper>
  );
}
