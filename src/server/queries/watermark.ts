import { cache } from "react";
import { getSiteConfigRow } from "./site-config";

export interface WatermarkConfig {
  enabled: boolean;
  position: string;
  sizePercentage: number;
  opacity: number;
  logoUrl: string;
}

export const getWatermarkConfig = cache(
  async (accountIdArg?: bigint): Promise<WatermarkConfig> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);

    if (!config) {
      return {
        enabled: false,
        position: "southeast",
        sizePercentage: 30,
        opacity: 0.8,
        logoUrl: "",
      };
    }

    // Parse watermarkProps JSON
    let watermarkProps;
    try {
      watermarkProps = JSON.parse(config.watermarkProps || "{}");
    } catch {
      watermarkProps = {};
    }

    return {
      enabled: watermarkProps.enabled || false,
      position: watermarkProps.position || "southeast",
      sizePercentage: watermarkProps.sizePercentage || 30,
      opacity: watermarkProps.opacity || 0.8,
      logoUrl: config.logo || "",
    };
  } catch (error) {
    console.error("❌ Error fetching watermark config:", error);
    return {
      enabled: false,
      position: "southeast",
      sizePercentage: 30,
      opacity: 0.8,
      logoUrl: "",
    };
  }
});