import { cache } from "react";
import { getSiteConfigRow } from "./site-config";

export type SocialLink = {
  platform:
    | "facebook"
    | "twitter"
    | "instagram"
    | "linkedin"
    | "youtube"
    | "tiktok";
  url: string;
  previewImage?: string;
};

export const getSocialLinks = cache(
  async (accountIdArg?: bigint): Promise<SocialLink[]> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);

    if (!config?.socialLinks) {
      // Return default values if no config found
      return [];
    }

    // Each platform value is either a plain URL string, or an object
    // `{ url, previewImage }` when a card preview image is configured.
    type StoredValue = string | { url?: string; previewImage?: string };
    const socialLinksData = JSON.parse(config.socialLinks) as Record<string, StoredValue>;

    // Convert object to array format expected by the component
    const supportedPlatforms: SocialLink["platform"][] = ["facebook", "twitter", "instagram", "linkedin", "youtube", "tiktok"];

    const socialLinks: SocialLink[] = Object.entries(socialLinksData)
      .filter(([platform]) =>
        supportedPlatforms.includes(platform.toLowerCase() as SocialLink["platform"]),
      ) // Only include supported platforms
      .map(([platform, value]) => {
        const url = (typeof value === "string" ? value : value?.url ?? "").trim();
        const previewImage =
          typeof value === "string" ? undefined : value?.previewImage?.trim() || undefined;
        return {
          platform: platform.toLowerCase() as SocialLink["platform"],
          url,
          previewImage,
        };
      })
      .filter((link) => link.url !== ""); // Only include entries with a non-empty URL

    return socialLinks;
  } catch (error) {
    console.error("Error fetching social links:", error);
    // Return default values on error
    return [];
  }
});