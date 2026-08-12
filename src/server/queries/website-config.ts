
import {
  type CardDisplayConfig,
  DEFAULT_CARD_DISPLAY,
  resolveCardDisplay,
} from "~/lib/card-display";
// Sólo el tipo: `listings.ts` importa de aquí en tiempo de ejecución, y un
// import de valor cerraría el ciclo.
import type { SortOption } from "./listings";
import {
  isAccount139,
  ACCOUNT_139_DESCRIPTION_ALIGN,
} from "~/lib/account-overrides/139";
import {
  isAccount155,
  ACCOUNT_155_FEATURED_MODE,
  ACCOUNT_155_FEATURED_GRID_COUNT,
} from "~/lib/account-overrides/155";

export type LinkItem = {
  title: string;
  url: string;
};

export type LinkCategory = {
  name: string;
  links: LinkItem[];
};

export const getLinksProps = (_accountIdArg?: bigint): LinkCategory[] => {
  return [];
}

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  category: string;
  questions: FaqItem[];
};

export const getFaqsProps = (_accountIdArg?: bigint): FaqCategory[] => {
  return [];
}

/**
 * Per-account website feature flags + light config. Stored as a JSON string in
 * `website_config.features_props`. Every field is optional; when undefined the
 * caller falls back to the historical default, so a null column = today's behavior.
 */
export type FeaturesProps = {
  pages?: {
    promociones?: boolean;
    servicios?: boolean;
    nosotros?: boolean;
  };
  sections?: {
    socialFamily?: boolean;
    /**
     * Where the social-family (Instagram) section renders on the homepage:
     * "top" (default, right below the hero) or "bottom" (just above Contacto).
     */
    socialFamilyPosition?: "top" | "bottom";
    /**
     * Subtitle under the social-family heading. Set to "" to hide it, mirroring
     * the menuLabels convention. Unset → the historical default copy.
     */
    socialFamilySubtitle?: string;
    /**
     * Which networks appear as cards in the social-family section. Unset → all
     * configured networks. The navbar/footer always show everything, so an
     * account can run four icons but feature only three as cards.
     */
    socialFamilyPlatforms?: (
      | "facebook"
      | "twitter"
      | "instagram"
      | "linkedin"
      | "youtube"
      | "tiktok"
    )[];
    /** Show the "Sobre Nosotros" section (services + mission + KPIs) on the homepage. Default true. */
    about?: boolean;
  };
  menuLabels?: {
    segundaMano?: string;
    alquilar?: string;
    inversion?: string;
    inversionSubtitle?: string;
    inversionHref?: string;
    vender?: string;
    /** Label for the navbar Nosotros link (e.g. "Sobre GO4"). Default "Nosotros". */
    nosotros?: string;
    /** Label for the contact CTA / titles (e.g. "Contacto"). Default "Contáctanos". */
    contacto?: string;
  };
  /** Hero shows direct-access buttons instead of the search bar. */
  heroDirectAccess?: boolean;
  /**
   * Copy and destination of each direct-access button. Read and validated by
   * `getHeroDirectButtons`, not from here — an empty or absent list falls back
   * to the two built-in Venta/Alquiler pills.
   */
  heroDirectButtons?: unknown[];
  /**
   * Placeholder inside the hero search bar. Unset → "¿Dónde quieres vivir?".
   * Only read when `heroDirectAccess` is off.
   */
  heroSearchPlaceholder?: string;
  /** Navbar Venta/Alquiler are direct links (no property-type mega-menu). */
  navDirectLinks?: boolean;
  /**
   * Order of the navbar entries, as keys ("venta", "alquiler", …), dragged from
   * the CRM. Unset → the order this template ships with. An entry the list
   * doesn't mention keeps its place; see `~/lib/nav-order`.
   */
  navOrder?: string[];
  /**
   * Show the navbar "Busca" search box (free text: reference, address, city,
   * title). Kept under the original key so existing site configs keep working.
   * Default true.
   */
  referenceSearch?: boolean;
  /** Show the bottom call-to-action on the /servicios page. Default true. */
  serviciosCta?: boolean;
  /**
   * Show the Servicios link in the navbar. Default true. Set false to keep the
   * /servicios page reachable (e.g. via a promo card) without a top-nav link.
   */
  serviciosInNav?: boolean;
  /** Contact CTA shows only the button (no heading/blurb). Default false. */
  contactCtaMinimal?: boolean;
  /** Navbar logo size. Unset → "standard". */
  logoSize?: "standard" | "medium" | "large" | "xlarge";
  /** Invert the logo colors on light backgrounds (navbar when scrolled) — for white logos. */
  logoInvertOnLight?: boolean;
  /** Darkness of the overlay over the hero background (0–1). Default 0.35. */
  heroOverlayOpacity?: number;
  /** Hero section height: "standard" (~88vh) or "full" (fills the screen). */
  heroSize?: "standard" | "full";
  /**
   * Hero banner height on the inner pages (/servicios, /nosotros):
   * "short" (~50vh) | "standard" (~75vh, default) | "full" (fills the screen).
   */
  pageHeroSize?: "short" | "standard" | "full";
  /**
   * "minimal" hides the small uppercase kicker above section titles and the
   * subtitle below them, site-wide, for a cleaner look. Defaults to "standard".
   */
  headerStyle?: "standard" | "minimal";
  /** When true, footer navigation renders as cards and the property-types column is hidden. */
  footerCards?: boolean;
  /**
   * /nosotros page layout. "default" (centered origins → values grid → team
   * grid) | "split" (origins left, values cards right, compact team below).
   * Unset → "default". Both variants render entirely from about_props.
   */
  nosotrosLayout?: "default" | "split";
  /**
   * Text alignment for description/paragraph blocks (service-card descriptions,
   * About/Nosotros body, property descriptions). Unset → keep each block's
   * existing alignment; "justify"/"center" override it site-wide.
   */
  descriptionAlign?: "justify" | "center";
  /**
   * Property-detail "Características" section layout.
   * "sections" (default) → grouped with section titles and the
   * "Ver más características" toggle. "flat" → every detail row in one block
   * and every feature chip in another, with no section titles or toggle.
   */
  characteristicsLayout?: "sections" | "flat";
  /**
   * Visual style of the property-detail characteristics.
   * "default" (today) | "boxed" (stat cards) | "emphasized" (stacked rows with
   * stronger hierarchy) | "twotone" (filled panel with alternating row shading).
   */
  characteristicsStyle?: "default" | "boxed" | "emphasized" | "twotone";
  /**
   * Homepage "Propiedades destacadas" behavior.
   * "grid" (default) → the full card grid, button navigates to the search page.
   * "feed" → a short teaser grid whose button opens the full-screen vertical
   * property feed (TikTok style) in place, without leaving the homepage.
   */
  featuredMode?: "grid" | "feed";
  /**
   * How many cards the "Propiedades destacadas" grid shows. Unset → every
   * listing fetched (12) in "grid" mode, 3 in "feed" mode.
   */
  featuredGridCount?: number;
};

/** Read the legacy `metadata.modules.promotions` flag (older accounts gated /promociones here). */
function readLegacyPromotions(
  metadata: string | null | undefined,
): boolean | undefined {
  if (!metadata) return undefined;
  try {
    const raw =
      typeof metadata === "string"
        ? (JSON.parse(metadata) as unknown)
        : metadata;
    const modules =
      raw && typeof raw === "object" && "modules" in raw
        ? (raw as { modules?: { promotions?: unknown } }).modules
        : undefined;
    return modules?.promotions === true ? true : undefined;
  } catch {
    return undefined;
  }
}

export const getFeaturesProps = (_accountIdArg?: bigint): FeaturesProps => {
  return {
  "pages": {
  "nosotros": true,
  "servicios": true,
  "promociones": false
},
  "heroSize": "full",
  "logoSize": "large",
  "sections": {
  "about": false,
  "socialFamily": true,
  "socialFamilyPosition": "bottom"
},
  "menuLabels": {
  "vender": "¿Quieres vender?",
  "alquilar": "",
  "inversion": "Invertir",
  "segundaMano": "Propiedades"
},
  "logoInvertOnLight": true,
  "heroOverlayOpacity": 0.55,
  "serviciosInNav": false
};
}

export type ModulesConfig = {
  promotionsEnabled: boolean;
};

// Thin wrapper kept for existing callers; promotions now lives in features_props
// (with legacy metadata.modules.promotions folded in by getFeaturesProps).
export const getModulesConfig = (): ModulesConfig => {
  return {
  "promotionsEnabled": false
};
}

export type PropertiesConfig = {
  title: string;
  subtitle: string;
  buttonText: string;
  itemsPerPage?: number;
  // Ya traducido al vocabulario de esta app por `resolveDefaultSort`: el CRM
  // guarda el suyo (`date-desc`, `date-asc`) y aquí nunca existió.
  defaultSort: SortOption;
  showDescription?: boolean;
  showReference?: boolean;
  // Días que un Vendido/Alquilado sigue en la web tras cerrarse. 0 (el valor
  // por defecto, y el que aplica a cualquier cuenta sin configurar) = sale al
  // instante. Lo consume `visibleStatusCondition` en queries/filters.ts.
  soldVisibilityDays: number;
  cardDisplay: CardDisplayConfig;
};

/** Rango que acepta el formulario del CRM; sanea JSON manipulado o antiguo. */
function resolveSoldVisibilityDays(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return 0;
  return Math.min(365, Math.max(0, Math.trunc(raw)));
}

/**
 * El selector "Orden por defecto" del CRM guarda su propio vocabulario
 * (`date-desc`, `date-asc`), que nunca existió aquí: el valor se leía, no se
 * traducía y no lo consumía ningún ORDER BY, así que la elección de la agencia
 * no llegaba a la web. Esta tabla es el único punto donde los dos vocabularios
 * se encuentran, y es la misma que usa v1 (`vestawebpage`).
 *
 * `price-desc` —el valor por defecto del CRM— cae en `"default"` a propósito:
 * el orden agrupado por tipo ya es precio descendente dentro de cada grupo, y
 * mapearlo al `price-desc` plano cambiaría el listado de las cuentas que nunca
 * tocaron el selector.
 */
const CRM_SORT_ALIASES: Record<string, SortOption> = {
  "price-desc": "default",
  "price-asc": "price-asc",
  "date-desc": "newest",
  "date-asc": "oldest",
};

const VALID_SORTS: readonly SortOption[] = [
  "default",
  "newest",
  "oldest",
  "price-asc",
  "price-desc",
  "size-asc",
  "size-desc",
];

// No se exporta: este módulo lleva "use server" y ahí sólo pueden exportarse
// funciones async. Exportar este helper síncrono hace que Next se niegue a
// compilar el módulo entero ("Server Actions must be async functions"), lo que
// tumba todas las páginas que leen website_config. No tiene llamantes fuera de
// este fichero.
function resolveDefaultSort(raw: unknown): SortOption {
  if (typeof raw !== "string") return "default";
  return (
    CRM_SORT_ALIASES[raw] ??
    (VALID_SORTS.includes(raw as SortOption) ? (raw as SortOption) : "default")
  );
}

export const getPropertiesConfig = (_accountIdArg?: bigint): PropertiesConfig => {
  return {
  "title": "Propiedades Destacadas",
  "subtitle": "Descubre nuestra selección de propiedades disponibles",
  "buttonText": "Ver Todas las Propiedades",
  "cardDisplay": {
  "cardTitle": "listing",
  "cardEyebrow": "location",
  "cardLocationField": "province"
},
  "soldVisibilityDays": 0,
  "defaultSort": "default"
};
}

export type SEOConfig = {
  title: string;
  description: string;
  name?: string;
  image?: string;
  url?: string;
  telephone?: string;
  email?: string;
  keywords?: string[] | string; // Support both array and string formats
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogSiteName?: string;
  ogLocale?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  /** Per-account Google Analytics 4 measurement ID (e.g. "G-XXXXXXXXXX"). */
  gaMeasurementId?: string;
};

export const getSEOConfig = (_accountIdArg?: bigint): SEOConfig => {
  return {
  "url": "https://www.grupomarinccm.com/",
  "name": "Grupo Marín",
  "email": "grupomarinbcn@gmail.com",
  "title": "Grupo Marín | Inmobiliaria en Premià de Dalt",
  "ogType": "website",
  "ogTitle": "Grupo Marín",
  "keywords": "Construcción, Promoción de obra nueva, Reformas integrales, Servicios inmobiliarios, Premià de Dalt, Premià de Mar, Vilassar de Mar, Barcelona, El Masnou, Montgat, Badalona, Mataró, Maresme",
  "ogLocale": "es_ES",
  "telephone": "936178921",
  "ogSiteName": "Grupo Marín",
  "description": "Grupo Marín: compraventa, alquiler, reformas y construcción en el Maresme. Todo en un solo lugar, con trato cercano y transparente.",
  "ogDescription": "Grupo Marín: compraventa, alquiler, reformas y construcción en el Maresme. Todo en un solo lugar, con trato cercano y transparente."
};
}
