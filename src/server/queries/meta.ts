import { cache } from "react";
import type { MetadataProps } from "../../lib/data";
import { getSiteConfigRow } from "./site-config";

export const getMetadataProps = cache(async (): Promise<MetadataProps | null> => {
  try {
    const config = await getSiteConfigRow();
    if (!config?.metadata) return null;
    try {
      return JSON.parse(config.metadata) as MetadataProps;
    } catch (parseError) {
      console.error("Failed to parse metadata JSON:", parseError);
      return null;
    }
  } catch (error) {
    console.error("Error fetching metadata props:", error);
    return null;
  }
});
