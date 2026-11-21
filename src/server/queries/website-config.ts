import { cache } from "react";
import { getSiteConfigRow } from "./site-config";
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
import { parseGoogleTag } from "~/lib/google-tag";
import { enlacesDelMenu, type EnlaceDelMenu } from "~/lib/nav-extra";
import { paginasDeLaWeb, type PaginaWeb } from "~/lib/pagina-propia";
import { parseMetaPixel } from "~/lib/meta-pixel";
import {
  resolveVideoFeatures,
  type ResolvedVideoFeatures,
  type VideoFeatures,
} from "~/lib/video-features";

export type LinkItem = {
  title: string;
  url: string;
};

export type LinkCategory = {
  name: string;
  links: LinkItem[];
};

export const getLinksProps = cache(
  async (accountIdArg?: bigint): Promise<LinkCategory[]> => {
    try {
      const config = await getSiteConfigRow(accountIdArg);

      if (!config?.linksProps) return [];

      const parsed = JSON.parse(config.linksProps) as unknown;
      return Array.isArray(parsed) ? (parsed as LinkCategory[]) : [];
    } catch (error) {
      console.error("Error fetching links props:", error);
      return [];
    }
  },
);

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  category: string;
  questions: FaqItem[];
};

export const getFaqsProps = cache(
  async (accountIdArg?: bigint): Promise<FaqCategory[]> => {
    try {
      const config = await getSiteConfigRow(accountIdArg);

      if (!config?.faqsProps) return [];

      const parsed = JSON.parse(config.faqsProps) as unknown;
      return Array.isArray(parsed) ? (parsed as FaqCategory[]) : [];
    } catch (error) {
      console.error("Error fetching faqs props:", error);
      return [];
    }
  },
);

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
     * Show `about_props.image` beside the homepage "Sobre Nosotros" text, with
     * the services grid moved under it. Default false: the section stays
     * text-only, as it is for every account that never set this.
     */
    aboutImage?: boolean;
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
    /** Show the category cards (Compraventa / Alquiler…) under the hero. Default true. */
    categories?: boolean;
  };
  menuLabels?: {
    segundaMano?: string;
    /** "" quita «Promociones» del menú (la página sigue). */
    promociones?: string;
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
   * Property types under the navbar Venta/Alquiler menus, as URL slugs
   * ("pisos", "casas", "locales", "solares", "garajes", "naves-industriales").
   * Unset → all of them.
   */
  navPropertyTypes?: string[];
  /**
   * Order of the navbar entries, as keys ("venta", "alquiler", …), dragged from
   * the CRM. Unset → the order this template ships with. An entry the list
   * doesn't mention keeps its place; see `~/lib/nav-order`.
   */
  navOrder?: string[];
  /**
   * Links the agency added to the menu, from the CRM chat (contrato
   * web-por-chat §10). Their key in `navOrder` is "extra:<href>". Checked on
   * read by `getFeaturesProps`: a broken one is dropped, not the bar.
   */
  navExtra?: EnlaceDelMenu[];
  /**
   * The agency's own pages, made of the template's blocks and drawn by
   * `[...slug]` (§10). Checked on read the same way, block by block.
   */
  paginas?: PaginaWeb[];
  /**
   * Show the navbar "Busca" search box (free text: reference, address, city,
   * title). Kept under the original key so existing site configs keep working.
   * Default true.
   */
  referenceSearch?: boolean;
  /**
   * Price cuts, e.g. [100000, 250000, 500000]. When set, the search box on the
   * sale results pages becomes one line: a price dropdown with those bands
   * (`~/lib/price-bands`) and nothing to type. Unset → the full box.
   */
  priceBands?: number[];
  /** Show the bottom call-to-action on the /servicios page. Default true. */
  serviciosCta?: boolean;
  /**
   * Show the Servicios link in the navbar. Default true. Set false to keep the
   * /servicios page reachable (e.g. via a promo card) without a top-nav link.
   */
  serviciosInNav?: boolean;
  /**
   * /servicios cards: "stacked" → one full-width card per row, photo beside
   * the copy, for long service descriptions (Ecogar, 122, from v1). Unset or
   * anything else → the 3-up grid every site has. Kept as `string`: the baked
   * literal is checked against this interface, and an undeclared or narrower
   * key fails the whole build (122 could not publish because of this one).
   */
  serviciosLayout?: string;
  /**
   * "icons": services on the homepage and /servicios as an even two-column
   * list (brand-colour icon, title, description) instead of cards. Unset →
   * "cards", the look every existing site has.
   */
  servicesStyle?: "cards" | "icons";
  /** "simple": eGO-style navbar (see Navbar `navStyle`). Unset → "standard". */
  navStyle?: "standard" | "simple";
  /**
   * "Versión 3" homepage pieces, each switched on separately. Unset →
   * "v1", the look every existing site has.
   *  - heroStyle: slideshow with one big spaced word per slide, a subtitle, an
   *    outlined button and square arrows (`hero_props.slides`).
   *  - propertiesStyle: photo-only cards with the text over the image, in two
   *    staggered columns.
   *  - aboutStyle: half photo / half text "Sobre Nosotros", then the services
   *    as an icon list.
   *  - footerStyle: light footer (logo, address, contact) over a brand strip
   *    with the legal links.
   * The reviews' version 3 lives in `testimonial_props.cardStyle: "v3"`.
   */
  heroStyle?: "v1" | "v3";
  propertiesStyle?: "v1" | "v3";
  aboutStyle?: "v1" | "v3";
  footerStyle?: "v1" | "v3";
  /**
   * Full-width photo band with a framed icon, a title, a line of copy and an
   * outlined button, between the properties and "Sobre Nosotros". Shown only
   * when `image` is set.
   */
  ctaBand?: {
    image?: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    href?: string;
  };
  /**
   * Show the Contacto link in the navbar. Default true. Set false to drop the
   * top-nav entry while /contacto stays reachable (footer, CTAs, direct link) —
   * same split as `serviciosInNav`, for agencies whose bar ends elsewhere.
   */
  contactoInNav?: boolean;
  /**
   * "Enlaces de interés" (/enlaces-de-interes) in the navbar. In v1 it was
   * always there unless set to false; here only an explicit true adds it, so
   * existing v2 sites don't move. Accounts coming from v1 with links set it to
   * true when they switch (docs/v1-a-v2.md). Declared also because 122 has it
   * saved as false, and an undeclared key fails the baked build.
   */
  enlacesInNav?: boolean;
  /**
   * /vender form. "completo" (unset) → the 3-step form that creates a Draft
   * listing. "corto" → v1's call-me form: name, phone, email; the owner goes
   * to Captaciones, no listing. Accounts coming from v1 set "corto" when they
   * switch (docs/v1-a-v2.md).
   */
  venderFormulario?: "corto" | "completo";
  /*
   * Lo que tenía la web v1 y una cuenta que viene de allí enciende al pasar
   * (docs/v1-a-v2.md §3 y §6). Sin la clave, la web se ve como hoy.
   */
  /** Ficha: tarjeta de la oficina con logo o inicial, nombre, teléfono y correo, también con el formulario abierto. */
  fichaTarjetaOficina?: boolean;
  /** Ficha: la ubicación con calle y código postal (los que deja la visibilidad), no «Ciudad, barrio». */
  fichaDireccion?: boolean;
  /** /contacto sin foto ni vídeo de cabecera: H1, migas y su párrafo. */
  contactoCabecera?: boolean;
  /** «Tiempo de respuesta estimado: menos de 24 horas» tras enviar el contacto, y en /nosotros. */
  respuesta24h?: boolean;
  /** Tarjetas: «En Venta» / «En Alquiler» en la foto, no «Venta» / «Alquiler». */
  tarjetaEtiquetaLarga?: boolean;
  /** Botón del banner en el color de la marca, no blanco. */
  bannerBotonMarca?: boolean;
  /** Orden por defecto de los resultados: tipo de inmueble antes que destacados. */
  ordenPorTipo?: boolean;
  /** «Compra» en vez de «Venta» en el buscador de la portada. */
  buscadorCompra?: boolean;
  /** Zona, casillas y barra de precio del buscador en el color de la marca. */
  buscadorColorMarca?: boolean;
  /** «Nave» en vez de «Nave industrial» en el menú de tipos. */
  buscadorNave?: boolean;
  /** El buscador de las v1 de antes de octubre (21, 122, 142): ver `opcionesBuscador`. */
  v1Antigua?: boolean;
  /** La primera v1 (21 y 142): «Busca por referencia» en el menú y /todo como venta. */
  v1Primera?: boolean;
  /**
   * La v1 de El Mito (142), anterior a la de 21: «Solares» y no «Terrenos», sin
   * «Naves» ni «Enlaces de interés» en el pie, tarjetas de portada más bajas,
   * galería sin pantalla completa, la fila «Referencia» y sin /promociones.
   */
  v1Inicial?: boolean;
  /** Un primer segmento que no es venta / alquiler / todo: 301 a su búsqueda de venta, no 404. */
  redirigirRutasAntiguas?: boolean;
  /** Cabecera teñida al 20 % del primario, nunca transparente sobre la portada. */
  headerTint?: boolean;
  /** «Nosotros» siempre (a /#about sin página) y «Contacto» a /#contact. */
  navHomeAnchors?: boolean;
  /** Enlaces del menú en texto normal de 14 px, sin versalitas ni pastilla, en una línea. */
  navTextoNormal?: boolean;
  /**
   * El aspecto de la v1 (docs/v1-a-v2.md §3): títulos en negrita centrados y
   * sin antetítulo, etiquetas en tipo oración, botones rectos, el pie con sus
   * títulos subrayados y las tarjetas de inmueble de la v1.
   */
  aspectoV1?: boolean;
  /** Pie claro al 20 % del primario, con el logo en su color. Gana a `footerBrand`. */
  footerTint?: boolean;
  /**
   * "sales": el botón de WhatsApp usa solo el móvil de ventas de la oficina
   * por defecto. `string` como `serviciosLayout`: otro valor guardado no debe
   * romper el build; lo que no sea "sales" es lo de hoy.
   */
  whatsappFrom?: string;
  /** Contact CTA shows only the button (no heading/blurb). Default false. */
  contactCtaMinimal?: boolean;
  /** Navbar logo size. Unset → "standard". */
  logoSize?: "standard" | "medium" | "large" | "xlarge";
  /** Invert the logo colors on light backgrounds (navbar when scrolled) — for white logos. */
  logoInvertOnLight?: boolean;
  /** Darkness of the overlay over the hero background (0–1). Default 0.35. */
  heroOverlayOpacity?: number;
  /**
   * Dark-to-transparent gradient behind the navbar on the hero, so white nav
   * links stay legible over bright skies without dimming the whole media.
   */
  heroTopScrim?: boolean;
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
  /**
   * Site-wide look. "editorial": left-aligned hero over a primary-colour tint
   * with two buttons instead of the search bar, headings in the heading font,
   * and (when contact_props.image is set) a brand-coloured "Ven a vernos"
   * panel above the contact form. Unset → "standard", the look every existing
   * site has.
   */
  siteStyle?: "standard" | "editorial";
  /**
   * Paint the footer with the account's primary colour instead of the fixed
   * dark navy. Default false. The text follows the contrast: dark on a light
   * primary, white on a dark one (footer.tsx, tintaSobrePrimario).
   */
  footerBrand?: boolean;
  /** When true, footer navigation renders as cards and the property-types column is hidden. */
  footerCards?: boolean;
  /**
   * /nosotros page layout. "default" (centered origins → values grid → team
   * grid) | "split" (origins left, values cards right, compact team below).
   * Unset → "default". Both variants render entirely from about_props.
   */
  nosotrosLayout?: "default" | "split";
  /** Team grid on /nosotros. Default true; false hides it, keeping about_props.team. */
  nosotrosTeam?: boolean;
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
  /**
   * ES/EN switcher in the header, backed by GTranslate. Kit Digital requires
   * the site in at least one other language. Unset/false → no switcher. Set in
   * the DB (not an account override): generated sites inline features_props.
   */
  languageSwitcher?: boolean;
  /** How property videos are shown. See ~/lib/video-features. */
  video?: VideoFeatures;
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

export const getFeaturesProps = cache(
  async (accountIdArg?: bigint): Promise<FeaturesProps> => {
    try {
      const config = await getSiteConfigRow(accountIdArg);

      const parsed: FeaturesProps =
        config?.featuresProps != null
          ? (JSON.parse(config.featuresProps) as FeaturesProps)
          : {};

      // Backward-compat: honor the legacy promotions flag when not set in features_props.
      if (parsed.pages?.promociones === undefined) {
        const legacy = readLegacyPromotions(config?.metadata);
        if (legacy !== undefined) {
          parsed.pages = { ...parsed.pages, promociones: legacy };
        }
      }

      // What the chat saved, checked again here: one bad entry drops alone.
      parsed.navExtra = enlacesDelMenu(parsed.navExtra);
      parsed.paginas = paginasDeLaWeb(parsed.paginas);

      // Account 139: justify every description/paragraph block site-wide. Forced in
      // code so admin UI edits to website_config can't wipe it.
      if (isAccount139(accountIdArg)) {
        parsed.descriptionAlign = ACCOUNT_139_DESCRIPTION_ALIGN;
      }

      // Account 155: "Propiedades destacadas" is a 3-card teaser whose button opens
      // the full-screen property feed. Forced in code so admin UI edits to
      // website_config can't wipe it.
      if (isAccount155(accountIdArg)) {
        parsed.featuredMode = ACCOUNT_155_FEATURED_MODE;
        parsed.featuredGridCount = ACCOUNT_155_FEATURED_GRID_COUNT;
      }

      return parsed;
    } catch (error) {
      console.error("Error fetching features props:", error);
      return {};
    }
  },
);

/**
 * Video display settings with every unset option at its original behaviour.
 * A plain function: getFeaturesProps is already request-cached.
 */
export async function getVideoFeatures(
  accountIdArg?: bigint,
): Promise<ResolvedVideoFeatures> {
  return resolveVideoFeatures((await getFeaturesProps(accountIdArg)).video);
}

export type ModulesConfig = {
  promotionsEnabled: boolean;
};

// Thin wrapper kept for existing callers; promotions now lives in features_props
// (with legacy metadata.modules.promotions folded in by getFeaturesProps).
export const getModulesConfig = cache(async (): Promise<ModulesConfig> => {
  const features = await getFeaturesProps();
  return { promotionsEnabled: features.pages?.promociones === true };
});

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

function resolveDefaultSort(raw: unknown): SortOption {
  if (typeof raw !== "string") return "default";
  return (
    CRM_SORT_ALIASES[raw] ??
    (VALID_SORTS.includes(raw as SortOption) ? (raw as SortOption) : "default")
  );
}

export const getPropertiesConfig = cache(
  async (accountIdArg?: bigint): Promise<PropertiesConfig> => {
    try {
      const config = await getSiteConfigRow(accountIdArg);
      const { tarjetaEtiquetaLarga, aspectoV1 } = await getFeaturesProps(accountIdArg);
      const cardOperationLabel = tarjetaEtiquetaLarga === true ? "long" : "short";
      const cardV1 = aspectoV1 === true;

      if (!config?.propertiesProps) {
        // Return default values if no config found
        return {
          title: "Propiedades Destacadas",
          subtitle: "Descubre nuestra selección de propiedades disponibles",
          buttonText: "Ver Todas las Propiedades",
          defaultSort: "default",
          showDescription: true,
          showReference: true,
          soldVisibilityDays: 0,
          cardDisplay: { ...DEFAULT_CARD_DISPLAY, cardOperationLabel, aspectoV1: cardV1 },
        };
      }

      const propertiesConfig = JSON.parse(
        config.propertiesProps,
      ) as Partial<PropertiesConfig>;

      // Provide defaults for any missing values
      return {
        title: propertiesConfig.title || "Propiedades Destacadas",
        // "" is a saved choice (no subtitle), as on GO4 and Domus Aurea.
        subtitle:
          propertiesConfig.subtitle ??
          "Descubre nuestra selección de propiedades disponibles",
        buttonText: propertiesConfig.buttonText || "Ver Todas las Propiedades",
        itemsPerPage: propertiesConfig.itemsPerPage,
        defaultSort: resolveDefaultSort(propertiesConfig.defaultSort),
        showDescription: propertiesConfig.showDescription !== false,
        showReference: propertiesConfig.showReference !== false,
        soldVisibilityDays: resolveSoldVisibilityDays(
          propertiesConfig.soldVisibilityDays,
        ),
        cardDisplay: {
          ...resolveCardDisplay(propertiesConfig.cardDisplay),
          cardOperationLabel,
          aspectoV1: cardV1,
        },
      };
    } catch (error) {
      console.error("Error fetching properties config:", error);
      // Return default values on error
      return {
        title: "Propiedades Destacadas",
        subtitle: "Descubre nuestra selección de propiedades disponibles",
        buttonText: "Ver Todas las Propiedades",
        defaultSort: "default",
        showDescription: true,
        showReference: true,
        soldVisibilityDays: 0,
        cardDisplay: DEFAULT_CARD_DISPLAY,
      };
    }
  },
);

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
  /** El píxel de Meta de la agencia (`head_props.facebookPixel`). */
  metaPixelId?: string;
};

/**
 * Pull the Google tag id out of `head_props`, the blob the website editor
 * writes. `parseGoogleTag` accepts the whole snippet Google hands out, not just
 * a bare id — see its own notes for why that matters.
 */
/** El píxel de Meta de `head_props.facebookPixel`, si lo hay y es un id válido. */
function readMetaPixelId(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { facebookPixel?: unknown };
    return (
      parseMetaPixel(
        typeof parsed?.facebookPixel === "string" ? parsed.facebookPixel : null,
      ) ?? undefined
    );
  } catch {
    return undefined;
  }
}

function readGoogleAnalyticsId(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as { googleAnalytics?: unknown };
    return parseGoogleTag(
      typeof parsed?.googleAnalytics === "string" ? parsed.googleAnalytics : null,
    )?.id;
  } catch {
    return undefined;
  }
}

export const getSEOConfig = cache(
  async (accountIdArg?: bigint): Promise<SEOConfig> => {
    try {
      const config = await getSiteConfigRow(accountIdArg);

      // Where the GA id actually lives. The website editor writes it to
      // `head_props.googleAnalytics` — it sits in the "Head" panel next to the
      // custom scripts — while this query only ever read `seo_props`, so every
      // agency that typed an id in got analytics that silently never fired.
      // head_props wins because it is the field the editor saves; seo_props
      // stays as a fallback for the accounts whose id was pasted there by hand
      // to work around exactly this.
      const gaFromHead = readGoogleAnalyticsId(config?.headProps);
      const metaPixelId = readMetaPixelId(config?.headProps);

      if (!config?.seoProps) {
        // Return default values if no config found
        return {
          title: "Inmobiliaria",
          description:
            "Propiedades premium en las mejores ubicaciones. Explora nuestros listados para encontrar tu hogar perfecto, apartamento o propiedad de inversión.",
          keywords:
            "bienes raíces, propiedades en venta, casas, apartamentos, agencia inmobiliaria",
          ogImage: undefined,
          ogTitle: "Inmobiliaria | Encuentra Tu Casa Soñada",
          ogDescription:
            "Propiedades premium en las mejores ubicaciones. Explora nuestros listados para encontrar tu hogar perfecto, apartamento o propiedad de inversión.",
          ogSiteName: "Inmobiliaria",
          ogLocale: "es_ES",
          ogType: "website",
          twitterCard: "summary_large_image",
          twitterTitle: "Inmobiliaria | Encuentra Tu Casa Soñada",
          twitterDescription:
            "Propiedades premium en las mejores ubicaciones. Explora nuestros listados para encontrar tu hogar perfecto, apartamento o propiedad de inversi��n.",
          twitterImage: undefined,
          gaMeasurementId: gaFromHead,
          metaPixelId,
        };
      }

      const seoConfig = JSON.parse(config.seoProps) as SEOConfig;

      // Provide defaults for any missing values
      return {
        title: seoConfig.title || "Inmobiliaria",
        description:
          seoConfig.description ||
          "Propiedades premium en las mejores ubicaciones.",
        name: seoConfig.name,
        image: seoConfig.image,
        url: seoConfig.url,
        telephone: seoConfig.telephone,
        email: seoConfig.email,
        keywords:
          seoConfig.keywords ||
          "bienes raíces, propiedades en venta, casas, apartamentos",
        ogImage: seoConfig.ogImage || seoConfig.image,
        ogTitle:
          seoConfig.ogTitle ||
          seoConfig.title ||
          "Inmobiliaria | Encuentra Tu Casa Soñada",
        ogDescription: seoConfig.ogDescription || seoConfig.description,
        ogUrl: seoConfig.ogUrl || seoConfig.url,
        ogSiteName: seoConfig.ogSiteName || seoConfig.name || "Inmobiliaria",
        ogLocale: seoConfig.ogLocale || "es_ES",
        ogType: seoConfig.ogType || "website",
        twitterCard: seoConfig.twitterCard || "summary_large_image",
        twitterTitle:
          seoConfig.twitterTitle || seoConfig.ogTitle || seoConfig.title,
        twitterDescription:
          seoConfig.twitterDescription ||
          seoConfig.ogDescription ||
          seoConfig.description,
        twitterImage:
          seoConfig.twitterImage || seoConfig.ogImage || seoConfig.image,
        gaMeasurementId: gaFromHead ?? seoConfig.gaMeasurementId,
        metaPixelId,
      };
    } catch (error) {
      console.error("Error fetching SEO config:", error);
      // Return default values on error
      return {
        title: "Inmobiliaria",
        description:
          "Propiedades premium en las mejores ubicaciones. Explora nuestros listados para encontrar tu hogar perfecto, apartamento o propiedad de inversión.",
        keywords:
          "bienes raíces, propiedades en venta, casas, apartamentos, agencia inmobiliaria",
        ogImage: undefined,
        ogTitle: "Inmobiliaria | Encuentra Tu Casa Soñada",
        ogDescription:
          "Propiedades premium en las mejores ubicaciones. Explora nuestros listados para encontrar tu hogar perfecto, apartamento o propiedad de inversión.",
        ogSiteName: "Inmobiliaria",
        ogLocale: "es_ES",
        ogType: "website",
        twitterCard: "summary_large_image",
        twitterTitle: "Inmobiliaria | Encuentra Tu Casa Soñada",
        twitterDescription:
          "Propiedades premium en las mejores ubicaciones. Explora nuestros listados para encontrar tu hogar perfecto, apartamento o propiedad de inversión.",
        twitterImage: undefined,
      };
    }
  },
);
