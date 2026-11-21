import { cache } from "react";
import type { FooterProps } from "../../lib/data";
import { getSiteConfigRow } from "./site-config";

export const getFooterProps = cache(
  async (accountIdArg?: bigint): Promise<FooterProps | null> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);
    if (!config?.footerProps) return null;
    return JSON.parse(config.footerProps) as FooterProps;
  } catch (error) {
    console.error("Error fetching footer props:", error);
    return null;
  }
});
