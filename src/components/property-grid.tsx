import { getListingsForGrid } from "~/server/queries/listings";
import {
  getFeaturesProps,
  getPropertiesConfig,
  getVideoFeatures,
} from "~/server/queries/website-config";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { isAccount139 } from "~/lib/account-overrides/139";
import { Destacados } from "./propertygrid/destacados";

export async function PropertyGrid({ accountId }: { accountId?: bigint } = {}) {
  const [listings, config, watermarkConfig, features, video] = await Promise.all([
    getListingsForGrid(12, accountId),
    getPropertiesConfig(accountId),
    getWatermarkConfig(accountId),
    getFeaturesProps(accountId),
    getVideoFeatures(accountId),
  ]);

  return (
    <Destacados
      listings={listings}
      config={config}
      watermarkEnabled={watermarkConfig.enabled && !!watermarkConfig.logoUrl}
      features={features}
      video={video}
      tight={isAccount139(accountId)}
    />
  );
}
