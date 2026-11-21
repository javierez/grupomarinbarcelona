import { cache } from "react";
import { getSiteConfigRow } from "./site-config";

export const getLogo = cache(
  async (accountIdArg?: bigint): Promise<string | null> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);
    return config?.logo || null;
  } catch (error) {
    console.error("Error fetching logo:", error);
    return null;
  }
});
