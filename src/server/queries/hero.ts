import { cache } from "react";
import type { HeroProps } from "../../lib/data";
import { getContactProps } from "./contact";
import { getSiteConfigRow } from "./site-config";

export type HeroPropsWithCities = HeroProps & { cities: string[] };

/**
 * Cities used for the homepage rotation and the navbar "Zonas" dropdown.
 * Sourced from the offices configured in `website_config.contact_props`,
 * not from the listings table — this is the authoritative list of cities
 * the agency has a physical presence in.
 */
export const getHeroCities = cache(
  async (accountIdArg?: bigint): Promise<string[]> => {
  try {
    const contactProps = await getContactProps(accountIdArg);
    const cities = (contactProps?.offices ?? [])
      .map((office) => office.address?.city)
      .filter((c): c is string => !!c && c.trim().length > 0);
    return Array.from(new Set(cities));
  } catch (error) {
    console.error("Error fetching hero cities:", error);
    return [];
  }
});

export const getHeroProps = cache(
  async (accountIdArg?: bigint): Promise<HeroProps | null> => {
  try {
    const config = await getSiteConfigRow(accountIdArg);

    if (!config?.heroProps) {
      return null;
    }

    // Clean the JSON string to remove control characters and fix quote issues
    let cleanedJson = config.heroProps;
    if (typeof cleanedJson === 'string') {
      // Fix double-double quotes issue first (e.g., ""{""key"":""value""}"" -> {"key":"value"})
      if (cleanedJson.startsWith('"{') && cleanedJson.endsWith('}"')) {
        // Remove outer quotes
        cleanedJson = cleanedJson.slice(1, -1);
        // Replace double-double quotes with single quotes
        cleanedJson = cleanedJson.replace(/""/g, '"');
      }
      
      // Replace actual newlines, carriage returns, and tabs with their escaped versions
      cleanedJson = cleanedJson
        .replace(/\n/g, '\\n')  // Replace newlines with \n
        .replace(/\r/g, '\\r')  // Replace carriage returns with \r
        .replace(/\t/g, '\\t'); // Replace tabs with \t
      
      // Remove other control characters except for standard whitespace
      cleanedJson = cleanedJson.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      
      // Also handle common issues with escaped quotes
      cleanedJson = cleanedJson.replace(/\\'/g, "'");
    }

    // heroProps is stored as JSON string, so parse it
    try {
      const heroProps = JSON.parse(cleanedJson) as HeroProps;
      return heroProps;
    } catch (parseError) {
      console.error("Error parsing hero props JSON:", parseError);
      console.error("Attempted to parse:", cleanedJson);
      // Return default values if parsing fails
      return {
        title: "Encuentra Tu Propiedad Soñada",
        subtitle: "Descubre propiedades excepcionales en ubicaciones privilegiadas.",
        backgroundImage: "/properties/sleek-city-tower.png",
        findPropertyButton: "Explorar Propiedades",
        contactButton: "Contáctanos"
      };
    }
  } catch (error) {
    console.error("Error fetching hero props:", error);
    return null; // Return null on error
  }
});
