import { cache } from "react";
import type { SeoProps } from "../../lib/data";
import { getSiteConfigRow } from "./site-config";

export const getSeoProps = cache(async (): Promise<SeoProps | null> => {
  try {
    const config = await getSiteConfigRow();
    if (!config?.seoProps) return null;
    return JSON.parse(config.seoProps) as SeoProps;
  } catch (error) {
    console.error("Error fetching seo props:", error);
    return null;
  }
});
