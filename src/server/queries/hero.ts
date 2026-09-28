import type { HeroProps } from "../../lib/data";
import { getContactProps } from "./contact";

export type HeroPropsWithCities = HeroProps & { cities: string[] };

/**
 * Cities used for the homepage rotation and the navbar "Zonas" dropdown.
 * Sourced from the offices configured in `website_config.contact_props`,
 * not from the listings table — this is the authoritative list of cities
 * the agency has a physical presence in.
 */
export const getHeroCities = (_accountIdArg?: bigint): string[] => {
  return ["Premià de Dalt", "Vilassar de Mar", "Barcelona", "Blanes"];
}

// Using React cache to memoize the query
export const getHeroProps = (_accountIdArg?: bigint): HeroProps | null => {
  return {
  "title": "Construcción, reformas e inmobiliaria",
  "subtitle": "Compraventa, alquiler y reformas de vivienda en el Maresme. Trato profesional y cercano.",
  "backgroundImage": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/hero/background_0kJ2YZvW.jpg",
  "backgroundVideo": "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/hero/background_2ssAOJtF.mp4",
  "backgroundType": "video",
  "findPropertyButton": "Explorar Propiedades",
  "contactButton": "Contáctanos"
};
}
