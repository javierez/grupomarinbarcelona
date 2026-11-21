import { cache } from "react";
import type { FontProps } from "../../lib/data";
import { getSiteConfigRow } from "./site-config";

export const getFontProps = cache(
  async (accountIdArg?: bigint): Promise<FontProps | null> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);
    if (!config?.fontProps) return null;
    return JSON.parse(config.fontProps) as FontProps;
  } catch (error) {
    console.error("Error fetching font props:", error);
    return null;
  }
});
