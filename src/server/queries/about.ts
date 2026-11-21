import { cache } from "react";
import type { AboutProps } from "../../lib/data";
import { getSiteConfigRow } from "./site-config";

// NOTE: resolveTeamPhotos lives in ./team-photos.ts (imported directly by
// callers), so this file stays a plain read of about_props.

export const getAboutProps = cache(
  async (accountIdArg?: bigint): Promise<AboutProps | null> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);
    if (!config?.aboutProps) return null;
    return JSON.parse(config.aboutProps) as AboutProps;
  } catch (error) {
    console.error("Error fetching about props:", error);
    return null;
  }
});
