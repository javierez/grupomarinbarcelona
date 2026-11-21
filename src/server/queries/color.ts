import { cache } from "react";
import type { ColorProps } from "../../lib/data";
import { getSiteConfigRow } from "./site-config";

export const getColorProps = cache(
  async (accountIdArg?: bigint): Promise<ColorProps | null> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);
    if (!config?.colorProps) return null;
    return JSON.parse(config.colorProps) as ColorProps;
  } catch (error) {
    console.error("Error fetching color props:", error);
    return null;
  }
});
