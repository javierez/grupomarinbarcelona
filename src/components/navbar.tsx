"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  Home,
  Building2,
  Store,
  LandPlot,
  Car,
  Warehouse,
  PlusCircle,
  Search,
  Sparkles,
  TrendingUp,
  Hammer,
  Map as MapIcon,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { Fragment, useState, useCallback, memo, useEffect, useRef, type CSSProperties } from "react";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { applyNavOrder } from "~/lib/nav-order";
import { claveDelEnlace, type EnlaceDelMenu } from "~/lib/nav-extra";
import { EnlaceExtra, EntradaDelMenu, useMenuEnVivo } from "~/components/navbar-extra";
import { resolveReferencePath } from "~/server/actions/reference-search";
import { SocialLinks, TikTokIcon } from "~/components/ui/social-links";
import { LanguageSwitcher } from "~/components/language-switcher";
import { VENTA_HREF, ALQUILER_HREF } from "~/lib/listing-links";
import {
  isAccount155,
  ACCOUNT_155_FEED_NAV_HREF,
  ACCOUNT_155_FEED_NAV_LABEL,
} from "~/lib/account-overrides/155";

// Types
type SocialPlatform =
  | "facebook"
  | "twitter"
  | "instagram"
  | "linkedin"
  | "youtube"
  | "tiktok";

interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

interface NavbarMenuLabels {
  segundaMano?: string;
  /** "" quita «Promociones» del menú. */
  promociones?: string;
  alquilar?: string;
  inversion?: string;
  vender?: string;
  nosotros?: string;
  inversionHref?: string;
}

interface NavbarProps {
  socialLinks?: SocialLink[];
  shortName?: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  promotionsEnabled?: boolean;
  hasNosotrosPage?: boolean;
  hasServiciosPage?: boolean;
  /** Blog link. Only true when the account turned the blog on AND asked for it in the menu. */
  blogInMenu?: boolean;
  /** Show the Contacto entry. Default true; false drops it from the bar only. */
  contactoInNav?: boolean;
  /** "Enlaces de interés" entry. Default false (v1 sites switch it on). */
  enlacesInNav?: boolean;
  blogLabel?: string;
  menuLabels?: NavbarMenuLabels;
  logoSize?: "standard" | "medium" | "large" | "xlarge";
  /**
   * "simple": eGO-style bar — plain words instead of small caps, more air,
   * an underline on hover, a search icon instead of the box, and no map
   * button or social icons. Default "standard".
   */
  navStyle?: "standard" | "simple";
  /** Invert the logo colors on light (scrolled/opaque) backgrounds — for white logos. */
  logoInvertOnLight?: boolean;
  /** Venta/Alquiler render as direct links (no property-type mega-menu). */
  directListingLinks?: boolean;
  /**
   * Property types listed under Venta/Alquiler, as URL slugs ("pisos",
   * "casas", "locales", "solares", "garajes", "naves-industriales"). Unset or
   * empty → all of them.
   */
  propertyTypes?: string[];
  /** Show the navbar "Busca" search box. Default true. */
  referenceSearch?: boolean;
  /**
   * Order of the centre entries, as keys ("venta", "alquiler", …). Unset keeps
   * the order this template ships with; see `~/lib/nav-order`.
   */
  navOrder?: string[];
  /** Links the agency added (`features_props.navExtra`), already validated. */
  navExtra?: EnlaceDelMenu[];
  /** GTranslate switcher next to the menu button. Default false. */
  languageSwitcher?: boolean;
  /** What the switcher offers besides Spanish. See `siteLanguagesFor`. */
  languages?: string[];
  /**
   * The v1 bar: always light, tinted with 20% of primaryColor (opaque over a
   * photo, translucent with blur elsewhere), dark links and the logo in its
   * own colours. Default false: transparent over the hero, as today.
   */
  headerTint?: boolean;
  /**
   * The v1 links: Nosotros always (its page, else /#about on the home) and
   * Contacto to /#contact. Default false: Nosotros only with its page, and
   * Contacto to /contacto.
   */
  navHomeAnchors?: boolean;
  /**
   * The v1 link style: plain words at 14px (no small caps, no pill), on one
   * line, closer together. With 7-8 entries and the search box the v2 style
   * doesn't fit at 1440px and «Enlaces de interés» wraps. Default false.
   */
  navTextoNormal?: boolean;
  /**
   * `features_props.aspectoV1`: the right side as on the v1 sites. The square
   * «Busca» box first, then the social icons, and no map button. Default false.
   */
  aspectoV1?: boolean;
  /** `features_props.v1Primera` (21 y 142): «Busca por referencia», en su caja algo más estrecha. */
  v1Primera?: boolean;
  /** `features_props.v1Antigua` (21, 122 y 142): sus menús no tenían naves. */
  v1Antigua?: boolean;
  /** `features_props.v1Inicial` (142): «Solares», no «Terrenos». */
  v1Inicial?: boolean;
  /**
   * Per-account hardcoded behaviours, resolved by the caller. Passed in rather
   * than read from env so the CRM preview can render any account correctly.
   */
  accountOverrides?: {
    is129?: boolean;
    showReformas?: boolean;
    showFeedNav?: boolean;
    /**
     * Desktop links bold, 16px and in this colour once the bar is white
     * (opaque). Ana Díaz (137) from v1; over the hero they stay white.
     */
    navLinkColor?: string;
    /**
     * No logo below lg: the reference search takes its place. Ana Díaz (137)
     * from v1.
     */
    hideLogoOnMobile?: boolean;
  };
}

/** Pages whose banner photo sits under the bar (`-mt-20`). */
const PHOTO_UNDER_BAR = ["/nosotros", "/servicios", "/contacto", "/vender", "/blog"];

type MegaKey = "segundamano" | "alquilar" | null;

/** El orden del menú de la v1 (`aspectoV1`) cuando la agencia no tiene uno propio. */
const ORDEN_V1 = ["venta", "alquiler", "promociones", "vender", "servicios", "nosotros", "contacto", "enlaces"];

const BUY_ITEMS = [
  { type: "pisos", text: "Pisos", href: "/venta-pisos/todas-ubicaciones", icon: Home },
  { type: "casas", text: "Casas", href: "/venta-casas/todas-ubicaciones", icon: Building2 },
  { type: "locales", text: "Locales", href: "/venta-locales/todas-ubicaciones", icon: Store },
  { type: "solares", text: "Terrenos", href: "/venta-solares/todas-ubicaciones", icon: LandPlot },
  { type: "garajes", text: "Garajes", href: "/venta-garajes/todas-ubicaciones", icon: Car },
  { type: "naves-industriales", text: "Naves", href: "/venta-naves-industriales/todas-ubicaciones", icon: Warehouse },
];

const RENT_ITEMS = [
  { type: "pisos", text: "Pisos", href: "/alquiler-pisos/todas-ubicaciones", icon: Home },
  { type: "casas", text: "Casas", href: "/alquiler-casas/todas-ubicaciones", icon: Building2 },
  { type: "locales", text: "Locales", href: "/alquiler-locales/todas-ubicaciones", icon: Store },
  { type: "solares", text: "Terrenos", href: "/alquiler-solares/todas-ubicaciones", icon: LandPlot },
  { type: "garajes", text: "Garajes", href: "/alquiler-garajes/todas-ubicaciones", icon: Car },
  { type: "naves-industriales", text: "Naves", href: "/alquiler-naves-industriales/todas-ubicaciones", icon: Warehouse },
];

/** "pisos", "pisos y casas", "pisos, casas y locales". */
function listJoin(words: string[]): string {
  if (words.length < 2) return words.join("");
  return `${words.slice(0, -1).join(", ")} y ${words[words.length - 1]}`;
}

// Memoized Social Links Section
const MobileSocialLinks = memo(({ links }: { links: SocialLink[] }) => (
  <div className="border-t bg-muted/50 backdrop-blur-sm" data-vesta="nav.redes">
    <div className="px-4 py-4">
      <div className="mb-3 text-xs font-medium text-muted-foreground">
        Síguenos en redes sociales
      </div>
      <SocialLinks links={links} />
    </div>
  </div>
));

MobileSocialLinks.displayName = "MobileSocialLinks";

export default function Navbar({
  socialLinks,
  shortName,
  logoUrl,
  primaryColor,
  promotionsEnabled: promocionesActivas = false,
  hasNosotrosPage = false,
  hasServiciosPage = false,
  blogInMenu = false,
  contactoInNav,
  enlacesInNav = false,
  blogLabel = "Blog",
  menuLabels,
  logoSize = "standard",
  navStyle = "standard",
  logoInvertOnLight = false,
  directListingLinks = false,
  propertyTypes,
  referenceSearch = true,
  navOrder: savedNavOrder,
  navExtra,
  languageSwitcher = false,
  languages = ["en"],
  headerTint = false,
  navHomeAnchors = false,
  navTextoNormal = false,
  aspectoV1 = false,
  v1Primera = false,
  v1Antigua = false,
  v1Inicial = false,
  accountOverrides,
}: NavbarProps): React.ReactElement {
  // In a draft the CRM can change these while the page is open.
  const { navExtra: extraLinks, navOrder } = useMenuEnVivo(navExtra, savedNavOrder);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const simple = navStyle === "simple";
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState<MegaKey>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Hero-backed pages can show the transparent navbar at the very top.
  // Everywhere else (listings, legal, vender, etc.) the navbar must be opaque
  // so its white-on-image text isn't invisible against a light background.
  // The CRM preview renders the homepage at /preview/home, where the navbar
  // sits on top of the hero exactly as it does at "/". Without this it renders
  // in its scrolled/opaque state over the hero photo — wrong colours, and a
  // logo inverted into invisibility on light backgrounds.
  const isHeroPage = pathname === "/" || pathname === "/preview/home";

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The v1 tinted bar is never transparent: dark links, logo in its colours.
  const isOpaque = headerTint || !isHeroPage || scrolled;
  // Over a photo the tint goes solid (a 20% veil over a photo can't carry dark
  // links); elsewhere it stays see-through with blur, as v1. --brand-primary
  // is the draft's live colour.
  const tintOverPhoto =
    (isHeroPage && !scrolled) ||
    PHOTO_UNDER_BAR.some((p) => pathname?.startsWith(p));
  const tintColor = headerTint && primaryColor
    ? `var(--brand-primary, ${primaryColor})`
    : null;
  const headerTintStyle: CSSProperties | undefined = tintColor
    ? {
        backgroundColor: tintOverPhoto
          ? `color-mix(in srgb, ${tintColor} 20%, hsl(var(--background)))`
          : `color-mix(in srgb, ${tintColor} 20%, transparent)`,
      }
    : undefined;
  const hideLogoOnMobile = accountOverrides?.hideLogoOnMobile ?? false;
  // These three used to read NEXT_PUBLIC_ACCOUNT_ID directly. They are props
  // now because the CRM preview renders an arbitrary account from a shared
  // deployment, where that env var is the WRONG account.
  const isAccount129 = accountOverrides?.is129 ?? false;
  // Account 141 (Grupo Marín) has a hardcoded /reformas page; every other
  // account 404s on it, so the link is gated the same way the page is.
  const showReformas = accountOverrides?.showReformas ?? false;
  // Account 155 (GO4) gets a "Descubre" pill opening the vertical video feed.
  const showFeedNav = accountOverrides?.showFeedNav ?? false;
  const navLinkColor = accountOverrides?.navLinkColor;
  // Config-driven: Venta/Alquilar as direct links (no mega-menu) and whether the
  // The navbar "Busca" search box shows.
  const useDirectListingLinks = directListingLinks;
  const keepType = (item: { type: string }) =>
    (!propertyTypes?.length || propertyTypes.includes(item.type)) &&
    !(v1Antigua && item.type === "naves-industriales");
  const comoLaV1 = <T extends { type: string; text: string }>(item: T): T =>
    v1Inicial && item.type === "solares" ? { ...item, text: "Solares" } : item;
  const buyItems = BUY_ITEMS.filter(keepType).map(comoLaV1);
  const rentItems = RENT_ITEMS.filter(keepType).map(comoLaV1);
  // "pisos, casas, locales y mucho más" only while every type is listed.
  const buyBlurb =
    buyItems.length === BUY_ITEMS.length
      ? "pisos, casas, locales y mucho más"
      : listJoin(buyItems.map((item) => item.text.toLowerCase()));
  const showRefSearch = referenceSearch !== false;
  // Without a logo on mobile, the search box fills its spot (v1, 137).
  const searchInLogoSpot = hideLogoOnMobile && showRefSearch && !simple;
  // Menu labels are config-driven (features_props); defaults preserve prior copy.
  const segundaManoLabel = menuLabels?.segundaMano ?? "Segunda Mano";
  // Same rule as Inversión / Alquilar / Vender: an explicit "" hides Venta
  // (desktop entry and the mobile block). Ecogar (122) shows only Servicios and
  // Contacto; in v1 that was a hardcoded override. Unset → shown, as before.
  const showVenta = segundaManoLabel.trim() !== "";
  const inversionLabel = menuLabels?.inversion ?? "Inversión";
  // Hide the Inversión/Destacados link when an account explicitly sets the label
  // to "" (empty). Unset → keep the historical default link.
  const showInversion = inversionLabel.trim() !== "";
  // `menuLabels.promociones: ""` quita el enlace del menú; la página sigue
  // (21 y 111: su v1 se generó con promociones apagadas y nunca lo enseñó).
  const promotionsEnabled = promocionesActivas && menuLabels?.promociones !== "";
  const venderLabel = menuLabels?.vender ?? "Vender";
  // Hide the Vender link when an account sets the label to "" (empty), mirroring
  // the Inversión behavior. Unset → keep the historical default link.
  const showVender = venderLabel.trim() !== "";
  // The Nosotros link keeps its own label so accounts can brand it (e.g.
  // "Sobre GO4"). Visibility comes from hasNosotrosPage, or navHomeAnchors.
  const nosotrosLabel = menuLabels?.nosotros ?? "Nosotros";
  // v1 links (navHomeAnchors): Nosotros always, unless its label is "", and
  // to the home's #about without its page; Contacto to the home's #contact.
  const showNosotros = navHomeAnchors ? nosotrosLabel.trim() !== "" : hasNosotrosPage;
  const nosotrosHref = navHomeAnchors && !hasNosotrosPage ? "/#about" : "/nosotros";
  const contactoHref = navHomeAnchors ? "/#contact" : "/contacto";
  const alquilarLabel = menuLabels?.alquilar ?? "Alquilar";
  // Contacto used to be the one entry no account could switch off. Unset keeps
  // it — only an explicit false drops it, so nothing moves for existing sites.
  const showContacto = contactoInNav !== false;
  // Hide the Alquilar nav item when an account sets the label to "" (empty),
  // mirroring the Inversión behavior.
  const showAlquilar = alquilarLabel.trim() !== "";
  const logoSizeClass =
    logoSize === "xlarge"
      ? "h-16 w-56 sm:h-20 sm:w-72"
      : logoSize === "large"
        ? "h-16 w-44 sm:h-20 sm:w-52"
        : logoSize === "medium"
          ? aspectoV1
            ? "h-16 w-40" // v1's medium logo, the same on a phone
            : "h-14 w-40 sm:h-16 sm:w-44"
          : "h-12 w-32 sm:h-14 sm:w-36";

  const handleMenuToggle = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleMenuClose();
        setMegaOpen(null);
      }
    },
    [handleMenuClose],
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = searchQuery.trim();
      if (trimmed) {
        // Una referencia de un único inmueble va directa a su ficha. Se resuelve
        // aquí y no con el redirect() de la página de resultados: ese redirect,
        // durante una navegación del lado del cliente, rompe el App Router
        // («Application error» hasta recargar). "todo" = venta y alquiler.
        void resolveReferencePath(trimmed)
          .catch(() => null)
          .then((target) =>
            router.push(
              target ??
                `/todo/todas-ubicaciones?q=${encodeURIComponent(trimmed)}`,
            ),
          );
        setSearchQuery("");
        setIsMenuOpen(false);
      }
    },
    [searchQuery, router],
  );

  const openMega = useCallback((key: MegaKey) => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setMegaOpen(key);
  }, []);

  const scheduleCloseMega = useCallback(() => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => setMegaOpen(null), 120);
  }, []);

  // Tone of all interactive elements depends on whether navbar is opaque.
  const linkTone = isOpaque
    ? "text-foreground/75 hover:text-foreground hover:bg-accent"
    : "text-white/90 hover:text-white hover:bg-white/15";

  const navLinkClass = simple
    ? cn(
        // 17px regular: font-light read too thin in white over a busy photo.
        "relative whitespace-nowrap px-1 py-2 text-[17px] font-normal transition-colors",
        // Underline that grows from the left on hover, as on eGO sites.
        "after:absolute after:inset-x-1 after:-bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100",
        isOpaque
          ? "text-foreground/85 hover:text-foreground"
          : "text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]",
      )
    : navTextoNormal
    ? cn(
        "whitespace-nowrap py-2 text-sm font-medium transition-colors",
        navLinkColor && isOpaque
          ? "text-base font-bold text-[color:var(--nav-link)] hover:opacity-80"
          : isOpaque
            ? // v1 (`aspectoV1`): the links in solid black, as on its sites.
              aspectoV1
              ? "text-foreground hover:opacity-80"
              : "text-foreground/75 hover:text-foreground"
            : "text-white/90 hover:text-white",
      )
    : cn(
        "rounded-full px-4 py-2 text-[13px] font-medium uppercase tracking-eyebrow transition-colors",
        // Make room for the ES/EN switcher without links wrapping word by word.
        languageSwitcher && "px-2.5 xl:whitespace-nowrap 2xl:px-4",
        navLinkColor && isOpaque
          ? "text-base font-bold text-[color:var(--nav-link)] hover:bg-accent"
          : linkTone,
      );
  // The colour is per account, so it rides on a CSS variable set on <nav>.
  const navLinkStyle = navLinkColor
    ? ({ "--nav-link": navLinkColor } as CSSProperties)
    : undefined;

  // One row of the mobile panel.
  // v1 (`aspectoV1`): las filas, títulos y huecos del panel de la v1.
  const mobileLinkClass = aspectoV1
    ? "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
    : "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground";
  const movilTitulo = aspectoV1
    ? "px-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
    : "px-2 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground";
  const movilSeccion = aspectoV1 ? "space-y-3" : "space-y-4";
  // Sin orden guardado, el de la v1: Alquilar antes que Promociones y
  // Servicios antes que Nosotros.
  const ordenDelMenu = navOrder?.length || !aspectoV1 ? navOrder : ORDEN_V1;

  // "Descubre" — the vertical video-style property feed. A filled pill rather
  // than a plain link so it reads as a separate browsing mode, not a section.
  const feedNavClass = cn(
    "group flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium uppercase tracking-eyebrow transition-all",
    isOpaque
      ? "bg-foreground text-background hover:bg-foreground/85"
      : "bg-white text-black hover:bg-white/90",
  );

  // The centre of the bar as data rather than as the order of the JSX, so
  // `features_props.navOrder` (dragged from the CRM's Navegación tab) can
  // reorder it. Account 129's bar is a separate hardcoded set and keeps its own
  // branch below — it isn't reorderable, and nothing configures it.
  // v1 (`aspectoV1`): «Comprar» y «Alquilar» abrían un desplegable pequeño
  // («Pisos en venta», …), no el panel ancho de la v2. Sus clases, tal cual.
  const desplegableV1 = (
    label: string,
    items: typeof buyItems,
    sufijo: string,
  ) =>
    mounted ? (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(navLinkClass, "flex items-center gap-1")}
          aria-label={`${label} opciones`}
        >
          {label} <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          {items.map((item) => (
            <DropdownMenuItem key={item.href}>
              <Link href={item.href} className="w-full">
                {item.text} {sufijo}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <span className={cn(navLinkClass, "flex items-center gap-1")}>
        {label} <ChevronDown className="h-3.5 w-3.5 opacity-50" />
      </span>
    );

  const ventaEntry = useDirectListingLinks ? (
    <Link href={VENTA_HREF} className={navLinkClass}>
      {segundaManoLabel}
    </Link>
  ) : aspectoV1 ? (
    desplegableV1(segundaManoLabel, buyItems, "en venta")
  ) : (
    <button
      type="button"
      className={cn(
        navLinkClass,
        "flex items-center gap-1",
        megaOpen === "segundamano" &&
          (simple
            ? "after:scale-x-100"
            : navTextoNormal
              ? "opacity-80"
              : isOpaque
                ? "bg-accent text-foreground"
                : "bg-white/15 text-white"),
      )}
      onMouseEnter={() => openMega("segundamano")}
      onMouseLeave={scheduleCloseMega}
      onClick={() => openMega(megaOpen === "segundamano" ? null : "segundamano")}
      aria-expanded={megaOpen === "segundamano"}
      aria-haspopup="true"
    >
      {segundaManoLabel} <ChevronDown className="h-4 w-4" />
    </button>
  );

  const alquilerEntry = useDirectListingLinks ? (
    <Link href={ALQUILER_HREF} className={navLinkClass}>
      {alquilarLabel}
    </Link>
  ) : aspectoV1 ? (
    desplegableV1(alquilarLabel, rentItems, "en alquiler")
  ) : (
    <button
      type="button"
      className={cn(
        navLinkClass,
        "flex items-center gap-1",
        megaOpen === "alquilar" &&
          (simple
            ? "after:scale-x-100"
            : navTextoNormal
              ? "opacity-80"
              : isOpaque
                ? "bg-accent text-foreground"
                : "bg-white/15 text-white"),
      )}
      onMouseEnter={() => openMega("alquilar")}
      onMouseLeave={scheduleCloseMega}
      onClick={() => openMega(megaOpen === "alquilar" ? null : "alquilar")}
      aria-expanded={megaOpen === "alquilar"}
      aria-haspopup="true"
    >
      {alquilarLabel} <ChevronDown className="h-4 w-4" />
    </button>
  );

  const navEntries = applyNavOrder(
    [
      { key: "venta" as const, node: ventaEntry, show: showVenta },
      {
        key: "reformas" as const,
        show: showReformas,
        node: (
          <Link href="/reformas" className={navLinkClass}>
            Reformas
          </Link>
        ),
      },
      {
        key: "promociones" as const,
        show: promotionsEnabled,
        node: (
          <Link href="/promociones" className={navLinkClass}>
            Promociones
          </Link>
        ),
      },
      {
        key: "inversion" as const,
        show: showInversion,
        node: (
          <Link href="/inversiones" className={navLinkClass}>
            {inversionLabel}
          </Link>
        ),
      },
      { key: "alquiler" as const, show: showAlquilar, node: alquilerEntry },
      {
        key: "vender" as const,
        show: showVender,
        node: (
          <Link href="/vender" className={navLinkClass}>
            {venderLabel}
          </Link>
        ),
      },
      {
        key: "nosotros" as const,
        show: showNosotros,
        node: (
          <Link href={nosotrosHref} className={navLinkClass}>
            {nosotrosLabel}
          </Link>
        ),
      },
      {
        key: "servicios" as const,
        show: hasServiciosPage,
        node: (
          <Link href="/servicios" className={navLinkClass}>
            Servicios
          </Link>
        ),
      },
      {
        key: "blog" as const,
        show: blogInMenu,
        node: (
          <Link href="/blog" className={navLinkClass}>
            {blogLabel}
          </Link>
        ),
      },
      {
        key: "contacto" as const,
        show: showContacto,
        node: (
          <Link href={contactoHref} className={navLinkClass}>
            Contacto
          </Link>
        ),
      },
      {
        key: "enlaces" as const,
        show: enlacesInNav,
        node: (
          <Link href="/enlaces-de-interes" className={navLinkClass}>
            Enlaces de interés
          </Link>
        ),
      },
      ...extraLinks.map((enlace) => ({
        key: claveDelEnlace(enlace.href),
        show: true,
        node: <EnlaceExtra enlace={enlace} className={navLinkClass} />,
      })),
    ].filter((entry) => entry.show),
    ordenDelMenu,
  );

  return (
    <header
      data-vesta="nav"
      className={cn(
        "fixed top-0 z-50 w-full transition-colors duration-300",
        headerTintStyle
          ? "border-b border-border/60 backdrop-blur-md"
          : isOpaque
          ? "border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85"
          : simple
            ? // Soft fade so white links stay legible over pale hero photos.
              "border-b border-transparent bg-transparent before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-36 before:bg-gradient-to-b before:from-black/45 before:via-black/15 before:to-transparent"
            : "border-b border-transparent bg-transparent",
      )}
      style={headerTintStyle}
      onKeyDown={handleKeyPress}
    >
      <div
        className={cn(
          "container mx-auto flex items-center justify-between px-4 sm:px-6",
          // v1 (`aspectoV1`): its 72 px bar, not the v2's 80 px.
          aspectoV1 ? "h-16 sm:h-[72px]" : "h-20",
        )}
      >
        {/* Logo */}
        <div className={cn("flex-shrink-0", hideLogoOnMobile && "hidden lg:block")}>
          <Link href="/" className="flex items-center gap-2" aria-label="Home" data-vesta="nav.logo">
            <div className={cn("relative", logoSizeClass)}>
              <Image
                src={logoUrl ?? "/vestazoomin.jpeg"}
                alt={shortName || "Vesta CRM Logo"}
                fill
                className={cn(
                  "object-contain transition-[filter] duration-300",
                  isOpaque ? (logoInvertOnLight ? "invert" : "") : "brightness-0 invert",
                )}
                priority
              />
            </div>
          </Link>
        </div>

        {/* Center nav */}
        <nav
          className={cn(
            simple
              ? "ml-auto mr-8 hidden items-center gap-6 lg:flex xl:gap-12"
              : navTextoNormal
                ? "hidden items-center gap-4 lg:flex xl:gap-6"
                : "hidden items-center gap-1 lg:flex xl:gap-2",
            // With the ES/EN switcher the bar doesn't fit at lg: burger until xl.
            languageSwitcher && "lg:hidden xl:flex",
          )}
          style={navLinkStyle}
          aria-label="Main navigation"
        >
          {isAccount129 ? (
            <>
              <EntradaDelMenu>{ventaEntry}</EntradaDelMenu>
              <Link href="/inversiones" className={navLinkClass} data-vesta="nav.enlace">
                {inversionLabel}
              </Link>
              <Link href="/nosotros" className={navLinkClass} data-vesta="nav.enlace">
                {nosotrosLabel}
              </Link>
              <Link href="/servicios" className={navLinkClass} data-vesta="nav.enlace">
                Servicios
              </Link>
              {showContacto && (
                <Link href="/contacto" className={navLinkClass} data-vesta="nav.enlace">
                  Contacto
                </Link>
              )}
              {showVender && (
                <Link href="/vender" className={navLinkClass} data-vesta="nav.enlace">
                  {venderLabel}
                </Link>
              )}
              {extraLinks.map((enlace) => (
                <EnlaceExtra key={enlace.href} enlace={enlace} className={navLinkClass} />
              ))}
            </>
          ) : (
            navEntries.map((entry) => <EntradaDelMenu key={entry.key}>{entry.node}</EntradaDelMenu>)
          )}
          {/* "Descubre" closes the bar wherever the rest is dragged to. */}
          {!isAccount129 && showFeedNav && (
            <Link
              href={ACCOUNT_155_FEED_NAV_HREF}
              className={feedNavClass}
              aria-label={`${ACCOUNT_155_FEED_NAV_LABEL} — ver propiedades en vídeo`}
            >
              <TikTokIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
              {ACCOUNT_155_FEED_NAV_LABEL}
            </Link>
          )}
        </nav>

        {/* Right - social + search + burger */}
        <div className={cn("flex items-center gap-2 sm:gap-4", searchInLogoSpot && "min-w-0 flex-1 lg:flex-none")}>
          <div className={simple ? "hidden" : "hidden lg:flex"} data-vesta="nav.redes">
            {socialLinks && socialLinks.length > 0 && (
              <SocialLinks
                links={socialLinks}
                iconClassName={
                  isOpaque
                    ? "text-foreground/70 hover:text-foreground"
                    : "text-white/85 hover:text-white"
                }
              />
            )}
          </div>
          <div
            className={cn(
              searchInLogoSpot
                ? "flex min-w-0 flex-1 items-center gap-2 lg:flex-none"
                : "hidden items-center gap-2 sm:flex",
              // v1: the search box first, then the rest in their order (☰ last).
              aspectoV1 && "order-first",
            )}
          >
            {simple && showRefSearch && (
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                aria-label="Buscar"
                aria-expanded={searchOpen}
                className={cn(
                  "flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-70",
                  isOpaque ? "text-foreground" : "text-white",
                )}
              >
                <Search className="h-5 w-5" strokeWidth={2.25} />
              </button>
            )}
            {showRefSearch && (!simple || searchOpen) && (
              // The ES/EN switcher needs that room on laptop widths; the map
              // search next to it stays.
              <form
                onSubmit={handleSearch}
                className={cn(
                  searchInLogoSpot && "min-w-0 flex-1 lg:flex-none",
                  languageSwitcher && !simple && "hidden 2xl:block",
                )}
                data-vesta="nav.buscador"
              >
                <div className={cn("relative", searchInLogoSpot && "w-full")}>
                  <Search
                    className={cn(
                      "absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors",
                      aspectoV1 ? "left-2" : "left-3",
                      isOpaque || aspectoV1 ? "text-muted-foreground" : "text-white/70",
                    )}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={v1Primera ? "Busca por referencia" : "Busca"}
                    aria-label="Buscar"
                    autoFocus={simple}
                    className={cn(
                      aspectoV1
                        ? "h-8 rounded-md border pl-7 pr-2 text-xs transition-all focus:w-56 focus:outline-none focus:ring-1"
                        : "h-9 rounded-full border pl-8 pr-3 text-xs transition-all focus:w-56 focus:outline-none focus:ring-1",
                      // 16px below lg: with less, the iPhone zooms in on tap.
                      searchInLogoSpot
                        ? cn("h-10 w-full text-base focus:w-full lg:w-44 lg:text-xs lg:focus:w-56", aspectoV1 ? "lg:h-8" : "lg:h-9")
                        : v1Primera
                        ? "w-40 focus:w-44"
                        : "w-44",
                      aspectoV1
                        ? "border-input bg-white placeholder:text-muted-foreground focus:ring-ring"
                        : isOpaque
                        ? "border-input bg-background placeholder:text-muted-foreground focus:ring-ring"
                        : "border-white/30 bg-white/10 text-white backdrop-blur placeholder:text-white/70 focus:ring-white/40",
                    )}
                  />
                </div>
              </form>
            )}
            {!simple && !aspectoV1 && (
              <Link
                href="/propiedades?vista=mapa"
                aria-label="Buscar en el mapa"
                title="Buscar en el mapa"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                  isOpaque
                    ? "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                    : "border-white/30 bg-white/10 text-white/80 backdrop-blur hover:bg-white/20 hover:text-white",
                )}
              >
                <MapIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
          {languageSwitcher && (
            <LanguageSwitcher
              languages={languages}
              onDark={!isOpaque}
              variant={simple ? "plain" : "pill"}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "lg:hidden",
              languageSwitcher && "lg:inline-flex xl:hidden",
              isOpaque
                ? ""
                : "text-white hover:bg-white/10 hover:text-white",
            )}
            onClick={handleMenuToggle}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            data-vesta-pasa
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Desktop mega-menu panel */}
      {mounted && megaOpen && (
        <div
          className={cn("absolute left-0 right-0 hidden border-t border-border/60 bg-background shadow-[0_30px_60px_-15px_rgba(15,23,42,0.35)] lg:block", aspectoV1 ? "top-[72px]" : "top-20")}
          onMouseEnter={() => openMega(megaOpen)}
          onMouseLeave={scheduleCloseMega}
        >
          <div className="container mx-auto px-6 py-16">
            <div className="grid grid-cols-12 gap-12">
              <div className="col-span-4 flex flex-col justify-between border-r border-border/60 pr-12">
                <div>
                  <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    {megaOpen === "segundamano" ? segundaManoLabel : alquilarLabel}
                  </span>
                  <h3 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                    {megaOpen === "segundamano"
                      ? "Encuentra tu nuevo hogar"
                      : "Alquila con tranquilidad"}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {megaOpen === "segundamano"
                      ? `Explora nuestra selección de propiedades en venta — ${buyBlurb}.`
                      : "Descubre opciones de alquiler en cualquier ubicación, ajustadas a tu estilo de vida."}
                  </p>
                </div>
                <Link
                  href={
                    megaOpen === "segundamano"
                      ? "/venta-propiedades/todas-ubicaciones"
                      : "/alquiler-propiedades/todas-ubicaciones"
                  }
                  className="mt-8 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-eyebrow text-foreground hover:text-foreground/70"
                  onClick={() => setMegaOpen(null)}
                  data-vesta="nav.enlace"
                >
                  Ver todo
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="col-span-8 grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
                {(megaOpen === "segundamano" ? buyItems : rentItems).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMegaOpen(null)}
                      data-vesta="nav.enlace"
                      className="group flex items-center gap-4 rounded-lg px-4 py-5 transition-colors hover:bg-accent"
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-border/60 transition-colors group-hover:border-foreground/40">
                        <Icon className="h-5 w-5 text-foreground/70" />
                      </div>
                      <div>
                        <span className="block text-base font-medium text-foreground">
                          {item.text}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {megaOpen === "segundamano" ? "En venta" : "En alquiler"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-300 ease-in-out lg:hidden",
          // Bajo su barra: la de v1 mide 64 px en el móvil y 72 desde sm.
          aspectoV1 ? "top-16 h-[calc(100vh-4rem)] sm:top-[72px] sm:h-[calc(100vh-4.5rem)]" : "top-20 h-[calc(100vh-5rem)]",
          languageSwitcher && "lg:block xl:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={handleMenuClose}
        aria-hidden={!isMenuOpen}
      />

      {/* Mobile Menu Panel */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 w-full bg-background backdrop-blur-md transition-all duration-300 ease-in-out lg:hidden",
          languageSwitcher && "lg:block xl:hidden",
          // Cerrado, sin sombra: si no, asoma como una franja gris en el borde derecho del móvil.
          isMenuOpen ? "translate-x-0 shadow-2xl" : "translate-x-full",
        )}
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-8 px-6 py-8">
              {showRefSearch && (
                <form onSubmit={handleSearch} className="sm:hidden" data-vesta="nav.buscador">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={v1Primera ? "Buscar por referencia..." : "Busca"}
                      className="h-11 w-full rounded-full border border-input bg-transparent pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                      aria-label="Buscar"
                    />
                  </div>
                </form>
              )}

              {showFeedNav && (
                <Link
                  href={ACCOUNT_155_FEED_NAV_HREF}
                  onClick={handleMenuClose}
                  data-vesta="nav.enlace"
                  className="flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium uppercase tracking-eyebrow text-background transition-colors hover:bg-foreground/85"
                >
                  <TikTokIcon className="h-4 w-4" />
                  {ACCOUNT_155_FEED_NAV_LABEL}
                </Link>
              )}

              {useDirectListingLinks ? (
                <div className="space-y-1">
                  {showVenta && (
                    <Link
                      href={VENTA_HREF}
                      onClick={handleMenuClose}
                      data-vesta="nav.enlace"
                      className={mobileLinkClass}
                    >
                      <Home className="h-4 w-4" />
                      {segundaManoLabel}
                    </Link>
                  )}
                  {showAlquilar && (
                    <Link
                      href={ALQUILER_HREF}
                      onClick={handleMenuClose}
                      data-vesta="nav.enlace"
                      className={mobileLinkClass}
                    >
                      <Building2 className="h-4 w-4" />
                      {alquilarLabel}
                    </Link>
                  )}
                </div>
              ) : showVenta ? (
                <div className={movilSeccion}>
                  <h3 className={movilTitulo}>
                    {segundaManoLabel}
                  </h3>
                  <div className="space-y-1">
                    {buyItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleMenuClose}
                          data-vesta="nav.enlace"
                          className={mobileLinkClass}
                        >
                          <Icon className="h-4 w-4" />
                          {item.text}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {!aspectoV1 && (promotionsEnabled || showInversion) && (
                <div className={movilSeccion}>
                  <h3 className={movilTitulo}>
                    Destacados
                  </h3>
                  <div className="space-y-1">
                    {!isAccount129 && promotionsEnabled && (
                      <Link
                        href="/promociones"
                        onClick={handleMenuClose}
                        data-vesta="nav.enlace"
                        className={mobileLinkClass}
                      >
                        <Sparkles className="h-4 w-4" />
                        Promociones
                      </Link>
                    )}
                    {showInversion && (
                      <Link
                        href="/inversiones"
                        onClick={handleMenuClose}
                        data-vesta="nav.enlace"
                        className={mobileLinkClass}
                      >
                        <TrendingUp className="h-4 w-4" />
                        {inversionLabel}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {!isAccount129 && !useDirectListingLinks && showAlquilar && (
                <div className={movilSeccion}>
                  <h3 className={movilTitulo}>
                    {aspectoV1 ? alquilarLabel : "Alquilar"}
                  </h3>
                  <div className="space-y-1">
                    {rentItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleMenuClose}
                          data-vesta="nav.enlace"
                          className={mobileLinkClass}
                        >
                          <Icon className="h-4 w-4" />
                          {item.text}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={movilSeccion}>
                <h3 className={movilTitulo}>
                  Más
                </h3>
                {/* Same `navOrder` as the desktop bar. The panel groups the
                    listing entries by category, so only this flat "Más" list
                    can honour a saved order — the rest sit under their own
                    headings wherever they are dragged to. */}
                <div className="space-y-1">
                  {applyNavOrder(
                    [
                      {
                        // v1: Promociones abre «Más», sin bloque propio.
                        key: "promociones" as const,
                        show: aspectoV1 && promotionsEnabled,
                        node: (
                          <Link
                            href="/promociones"
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            <Building2 className="h-4 w-4" />
                            Promociones
                          </Link>
                        ),
                      },
                      {
                        key: "reformas" as const,
                        show: showReformas,
                        node: (
                          <Link
                            href="/reformas"
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            <Hammer className="h-4 w-4" />
                            Reformas
                          </Link>
                        ),
                      },
                      {
                        key: "vender" as const,
                        show: showVender,
                        node: (
                          <Link
                            href="/vender"
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            <PlusCircle className="h-4 w-4" />
                            {venderLabel}
                          </Link>
                        ),
                      },
                      {
                        key: "nosotros" as const,
                        show: showNosotros || isAccount129,
                        node: (
                          <Link
                            href={nosotrosHref}
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            {nosotrosLabel}
                          </Link>
                        ),
                      },
                      {
                        key: "servicios" as const,
                        show: hasServiciosPage || isAccount129,
                        node: (
                          <Link
                            href="/servicios"
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            Servicios
                          </Link>
                        ),
                      },
                      {
                        key: "blog" as const,
                        show: blogInMenu,
                        node: (
                          <Link
                            href="/blog"
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            {blogLabel}
                          </Link>
                        ),
                      },
                      {
                        key: "contacto" as const,
                        show: showContacto,
                        node: (
                          <Link
                            href={contactoHref}
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            Contacto
                          </Link>
                        ),
                      },
                      {
                        key: "enlaces" as const,
                        show: enlacesInNav,
                        node: (
                          <Link
                            href="/enlaces-de-interes"
                            className={mobileLinkClass}
                            data-vesta="nav.enlace"
                            onClick={handleMenuClose}
                          >
                            {aspectoV1 && <ExternalLink className="h-4 w-4" />}
                            Enlaces de interés
                          </Link>
                        ),
                      },
                      ...extraLinks.map((enlace) => ({
                        key: claveDelEnlace(enlace.href),
                        show: true,
                        node: (
                          <EnlaceExtra
                            enlace={enlace}
                            className={mobileLinkClass}
                            onClick={handleMenuClose}
                          />
                        ),
                      })),
                    ].filter((entry) => entry.show),
                    ordenDelMenu,
                  ).map((entry) => (
                    <Fragment key={entry.key}>{entry.node}</Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {socialLinks && socialLinks.length > 0 && (
            <MobileSocialLinks links={socialLinks} />
          )}
        </div>
      </div>
    </header>
  );
}
