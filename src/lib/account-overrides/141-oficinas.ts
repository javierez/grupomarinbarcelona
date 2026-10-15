// Office → catchment mapping for account 141 (Grupo Marín).
//
// `listings.office_id` exists in the database but is ~95 % empty for this
// account (only "Vilassar" has any rows, "Barcelona" has none), so the website
// cannot filter by it yet. Until that column is backfilled we filter by the
// towns each office actually covers, which every listing does have.
//
// The office records themselves (name, address, phone) come from the `offices`
// table — see ~/server/queries/offices.ts. Only the town catchment lives here,
// because it is an editorial decision, not something the schema records.
//
// NOTE: these assignments are a best-effort read of the Maresme geography and
// should be confirmed with Grupo Marín before being treated as authoritative.

export const ACCOUNT_141_OFFICE_ORDER = [
  "Barcelona",
  "Vilassar de Mar",
  "Premià de Dalt",
  "Blanes",
] as const;

/**
 * Towns covered by each office, keyed by the office's own `city` column.
 * Values are matched case/accent-insensitively against `locations.city`.
 */
export const ACCOUNT_141_OFFICE_CATCHMENTS: Record<string, readonly string[]> = {
  // Barcelona city + the inner metropolitan belt.
  Barcelona: [
    "Barcelona",
    "Poble Nou",
    "Badalona",
    "Mas Ram",
    "Santa Coloma de Gramenet",
    "Santa Coloma de Gramanet", // misspelling present in the data
    "L'hospitalet de Llobregat",
    "Sant Boi de Llobregat",
    "Esplugues de Llobregat",
    "Montgat",
  ],
  // Central Maresme, from Alella up to Mataró.
  "Vilassar de Mar": [
    "Vilassar de Mar",
    "Vilassar de Dalt",
    "El Masnou",
    "Alella",
    "Teià",
    "Cabrera de Mar",
    "Cabrils",
    "Argentona",
    "Dosrius",
    "Can Massuet del Far",
    "Mataró",
    "Sant Andreu de Llavaneres",
    "Llavaneres",
    "Caldes D'estrac",
  ],
  // Premià, immediately inland from Vilassar.
  "Premià de Dalt": ["Premià de Dalt", "Premià de Mar"],
  // Alt Maresme and La Selva.
  Blanes: [
    "Blanes",
    "Malgrat de Mar",
    "Palafolls",
    "Pineda de Mar",
    "Calella",
  ],
};

/** Towns for one office, or [] if the office has no catchment configured. */
export function catchmentFor(officeCity: string | null): readonly string[] {
  if (!officeCity) return [];
  return ACCOUNT_141_OFFICE_CATCHMENTS[officeCity] ?? [];
}

const S3 =
  "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/141/website/oficinas";

export type OfficePhoto = {
  src: string;
  alt: string;
  /** Attribution — required by the CC licences these photos are published under. */
  author: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

/**
 * Town photos, sourced from Wikimedia Commons under CC licences. Every one of
 * these requires visible attribution, which <OfficesSection /> renders beneath
 * the cards — do not drop that credit line when editing the section.
 *
 * The Premià photo is CC BY-SA 4.0, so the cropped version we serve is itself
 * CC BY-SA 4.0. That obligation applies to the image only, not to the site.
 */
export const ACCOUNT_141_OFFICE_PHOTOS: Record<string, OfficePhoto> = {
  Barcelona: {
    src: `${S3}/barcelona.jpg`,
    alt: "Vista de Barcelona con las torres de la Sagrada Família al fondo",
    author: "Thomas Quine",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Barcelona_skyline_panorama_(6248341915).jpg",
  },
  "Vilassar de Mar": {
    src: `${S3}/vilassar-de-mar.jpg`,
    alt: "Vista de Vilassar de Mar y el Maresme desde la sierra",
    author: "Friviere",
    license: "CC BY 3.0",
    licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Catalonia_VilassarDeMarVista.JPG",
  },
  "Premià de Dalt": {
    src: `${S3}/premia-de-dalt.jpg`,
    alt: "Masías y casas en la ladera de La Cisa, Premià de Dalt",
    author: "Enric",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:134_La_Cisa_(Premi%C3%A0_de_Dalt),_amb_el_santuari_i_el_mas.jpg",
  },
  Blanes: {
    src: `${S3}/blanes.jpg`,
    alt: "Sa Palomera y la playa de Blanes al atardecer",
    author: "Jorge Franganillo",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Blanes_Sa_Palomera_(15666626468).jpg",
  },
};

export function photoFor(officeCity: string | null): OfficePhoto | null {
  if (!officeCity) return null;
  return ACCOUNT_141_OFFICE_PHOTOS[officeCity] ?? null;
}
