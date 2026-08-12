"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import {
  Menu,
  X,
  ChevronDown,
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
import { Fragment, useState, useCallback, memo, useEffect, useRef } from "react";
import { cn } from "~/lib/utils";
import { applyNavOrder } from "~/lib/nav-order";
import { SocialLinks, TikTokIcon } from "~/components/ui/social-links";
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
  blogLabel?: string;
  menuLabels?: NavbarMenuLabels;
  logoSize?: "standard" | "medium" | "large" | "xlarge";
  /** Invert the logo colors on light (scrolled/opaque) backgrounds — for white logos. */
  logoInvertOnLight?: boolean;
  /** Venta/Alquiler render as direct links (no property-type mega-menu). */
  directListingLinks?: boolean;
  /** Show the navbar "Busca" search box. Default true. */
  referenceSearch?: boolean;
  /**
   * Order of the centre entries, as keys ("venta", "alquiler", …). Unset keeps
   * the order this template ships with; see `~/lib/nav-order`.
   */
  navOrder?: string[];
  /**
   * Per-account hardcoded behaviours, resolved by the caller. Passed in rather
   * than read from env so the CRM preview can render any account correctly.
   */
  accountOverrides?: {
    is129?: boolean;
    showReformas?: boolean;
    showFeedNav?: boolean;
  };
}

type MegaKey = "segundamano" | "alquilar" | null;

const BUY_ITEMS = [
  { text: "Pisos", href: "/venta-pisos/todas-ubicaciones", icon: Home },
  { text: "Casas", href: "/venta-casas/todas-ubicaciones", icon: Building2 },
  { text: "Locales", href: "/venta-locales/todas-ubicaciones", icon: Store },
  { text: "Terrenos", href: "/venta-solares/todas-ubicaciones", icon: LandPlot },
  { text: "Garajes", href: "/venta-garajes/todas-ubicaciones", icon: Car },
  { text: "Naves", href: "/venta-naves-industriales/todas-ubicaciones", icon: Warehouse },
];

const RENT_ITEMS = [
  { text: "Pisos", href: "/alquiler-pisos/todas-ubicaciones", icon: Home },
  { text: "Casas", href: "/alquiler-casas/todas-ubicaciones", icon: Building2 },
  { text: "Locales", href: "/alquiler-locales/todas-ubicaciones", icon: Store },
  { text: "Terrenos", href: "/alquiler-solares/todas-ubicaciones", icon: LandPlot },
  { text: "Garajes", href: "/alquiler-garajes/todas-ubicaciones", icon: Car },
  { text: "Naves", href: "/alquiler-naves-industriales/todas-ubicaciones", icon: Warehouse },
];

// Memoized Social Links Section
const MobileSocialLinks = memo(({ links }: { links: SocialLink[] }) => (
  <div className="border-t bg-muted/50 backdrop-blur-sm">
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
  promotionsEnabled = false,
  hasNosotrosPage = false,
  hasServiciosPage = false,
  blogInMenu = false,
  blogLabel = "Blog",
  menuLabels,
  logoSize = "standard",
  logoInvertOnLight = false,
  directListingLinks = false,
  referenceSearch = true,
  navOrder,
  accountOverrides,
}: NavbarProps): React.ReactElement {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const isOpaque = !isHeroPage || scrolled;
  // These three used to read NEXT_PUBLIC_ACCOUNT_ID directly. They are props
  // now because the CRM preview renders an arbitrary account from a shared
  // deployment, where that env var is the WRONG account.
  const isAccount129 = accountOverrides?.is129 ?? false;
  // Account 141 (Grupo Marín) has a hardcoded /reformas page; every other
  // account 404s on it, so the link is gated the same way the page is.
  const showReformas = accountOverrides?.showReformas ?? false;
  // Account 155 (GO4) gets a "Descubre" pill opening the vertical video feed.
  const showFeedNav = accountOverrides?.showFeedNav ?? false;
  // Config-driven: Venta/Alquilar as direct links (no mega-menu) and whether the
  // The navbar "Busca" search box shows.
  const useDirectListingLinks = directListingLinks;
  const showRefSearch = referenceSearch !== false;
  // Menu labels are config-driven (features_props); defaults preserve prior copy.
  const segundaManoLabel = menuLabels?.segundaMano ?? "Segunda Mano";
  const inversionLabel = menuLabels?.inversion ?? "Inversión";
  // Hide the Inversión/Destacados link when an account explicitly sets the label
  // to "" (empty). Unset → keep the historical default link.
  const showInversion = inversionLabel.trim() !== "";
  const venderLabel = menuLabels?.vender ?? "Vender";
  // Hide the Vender link when an account sets the label to "" (empty), mirroring
  // the Inversión behavior. Unset → keep the historical default link.
  const showVender = venderLabel.trim() !== "";
  // The Nosotros link keeps its own label so accounts can brand it (e.g.
  // "Sobre GO4"). Visibility still comes from hasNosotrosPage.
  const nosotrosLabel = menuLabels?.nosotros ?? "Nosotros";
  const alquilarLabel = menuLabels?.alquilar ?? "Alquilar";
  // Hide the Alquilar nav item when an account sets the label to "" (empty),
  // mirroring the Inversión behavior.
  const showAlquilar = alquilarLabel.trim() !== "";
  const logoSizeClass =
    logoSize === "xlarge"
      ? "h-16 w-56 sm:h-20 sm:w-72"
      : logoSize === "large"
        ? "h-16 w-44 sm:h-20 sm:w-52"
        : logoSize === "medium"
          ? "h-14 w-40 sm:h-16 sm:w-44"
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
        // "todo" = every listing type, so a reference finds sales AND rentals.
        // The results page short-circuits to the property detail page when the
        // query resolves to exactly one listing by reference.
        router.push(`/todo/todas-ubicaciones?q=${encodeURIComponent(trimmed)}`);
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

  const navLinkClass = cn(
    "rounded-full px-4 py-2 text-[13px] font-medium uppercase tracking-eyebrow transition-colors",
    linkTone,
  );

  // One row of the mobile panel.
  const mobileLinkClass =
    "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground";

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
  const ventaEntry = useDirectListingLinks ? (
    <Link href={VENTA_HREF} className={navLinkClass}>
      {segundaManoLabel}
    </Link>
  ) : (
    <button
      type="button"
      className={cn(
        navLinkClass,
        "flex items-center gap-1",
        megaOpen === "segundamano" &&
          (isOpaque ? "bg-accent text-foreground" : "bg-white/15 text-white"),
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
  ) : (
    <button
      type="button"
      className={cn(
        navLinkClass,
        "flex items-center gap-1",
        megaOpen === "alquilar" &&
          (isOpaque ? "bg-accent text-foreground" : "bg-white/15 text-white"),
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
      { key: "venta" as const, node: ventaEntry, show: true },
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
        show: hasNosotrosPage,
        node: (
          <Link href="/nosotros" className={navLinkClass}>
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
        show: true,
        node: (
          <Link href="/contacto" className={navLinkClass}>
            Contacto
          </Link>
        ),
      },
      {
        key: "descubre" as const,
        show: showFeedNav,
        node: (
          <Link
            href={ACCOUNT_155_FEED_NAV_HREF}
            className={feedNavClass}
            aria-label={`${ACCOUNT_155_FEED_NAV_LABEL} — ver propiedades en vídeo`}
          >
            <TikTokIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            {ACCOUNT_155_FEED_NAV_LABEL}
          </Link>
        ),
      },
    ].filter((entry) => entry.show),
    navOrder,
  );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-colors duration-300",
        isOpaque
          ? "border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85"
          : "border-b border-transparent bg-transparent",
      )}
      onKeyDown={handleKeyPress}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center gap-2" aria-label="Home">
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
          className="hidden items-center gap-1 lg:flex xl:gap-2"
          aria-label="Main navigation"
        >
          {isAccount129 ? (
            <>
              {ventaEntry}
              <Link href="/inversiones" className={navLinkClass}>
                {inversionLabel}
              </Link>
              <Link href="/nosotros" className={navLinkClass}>
                {nosotrosLabel}
              </Link>
              <Link href="/servicios" className={navLinkClass}>
                Servicios
              </Link>
              <Link href="/contacto" className={navLinkClass}>
                Contacto
              </Link>
              {showVender && (
                <Link href="/vender" className={navLinkClass}>
                  {venderLabel}
                </Link>
              )}
            </>
          ) : (
            navEntries.map((entry) => (
              <Fragment key={entry.key}>{entry.node}</Fragment>
            ))
          )}
        </nav>

        {/* Right - social + search + burger */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex">
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
          <div className="hidden items-center gap-2 sm:flex">
            {showRefSearch && (
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search
                    className={cn(
                      "absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-colors",
                      isOpaque ? "text-muted-foreground" : "text-white/70",
                    )}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Busca"
                    aria-label="Buscar"
                    className={cn(
                      "h-9 w-44 rounded-full border pl-8 pr-3 text-xs transition-all focus:w-56 focus:outline-none focus:ring-1",
                      isOpaque
                        ? "border-input bg-background placeholder:text-muted-foreground focus:ring-ring"
                        : "border-white/30 bg-white/10 text-white backdrop-blur placeholder:text-white/70 focus:ring-white/40",
                    )}
                  />
                </div>
              </form>
            )}
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
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "lg:hidden",
              isOpaque
                ? ""
                : "text-white hover:bg-white/10 hover:text-white",
            )}
            onClick={handleMenuToggle}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
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
          className="absolute left-0 right-0 top-20 hidden border-t border-border/60 bg-background shadow-[0_30px_60px_-15px_rgba(15,23,42,0.35)] lg:block"
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
                      ? "Explora nuestra selección de propiedades en venta — pisos, casas, locales y mucho más."
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
                >
                  Ver todo
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="col-span-8 grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-3">
                {(megaOpen === "segundamano" ? BUY_ITEMS : RENT_ITEMS).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMegaOpen(null)}
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
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={handleMenuClose}
        aria-hidden={!isMenuOpen}
      />

      {/* Mobile Menu Panel */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 top-20 h-[calc(100vh-5rem)] w-full bg-background shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out lg:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!isMenuOpen}
      >
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-8 px-6 py-8">
              {showRefSearch && (
                <form onSubmit={handleSearch} className="sm:hidden">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Busca"
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
                  className="flex items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium uppercase tracking-eyebrow text-background transition-colors hover:bg-foreground/85"
                >
                  <TikTokIcon className="h-4 w-4" />
                  {ACCOUNT_155_FEED_NAV_LABEL}
                </Link>
              )}

              {useDirectListingLinks ? (
                <div className="space-y-1">
                  <Link
                    href={VENTA_HREF}
                    onClick={handleMenuClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Home className="h-4 w-4" />
                    {segundaManoLabel}
                  </Link>
                  {showAlquilar && (
                    <Link
                      href={ALQUILER_HREF}
                      onClick={handleMenuClose}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Building2 className="h-4 w-4" />
                      {alquilarLabel}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="px-2 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    {segundaManoLabel}
                  </h3>
                  <div className="space-y-1">
                    {BUY_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleMenuClose}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Icon className="h-4 w-4" />
                          {item.text}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {(promotionsEnabled || showInversion) && (
                <div className="space-y-4">
                  <h3 className="px-2 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Destacados
                  </h3>
                  <div className="space-y-1">
                    {!isAccount129 && promotionsEnabled && (
                      <Link
                        href="/promociones"
                        onClick={handleMenuClose}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Sparkles className="h-4 w-4" />
                        Promociones
                      </Link>
                    )}
                    {showInversion && (
                      <Link
                        href="/inversiones"
                        onClick={handleMenuClose}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <TrendingUp className="h-4 w-4" />
                        {inversionLabel}
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {!isAccount129 && !useDirectListingLinks && showAlquilar && (
                <div className="space-y-4">
                  <h3 className="px-2 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Alquilar
                  </h3>
                  <div className="space-y-1">
                    {RENT_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleMenuClose}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
                        >
                          <Icon className="h-4 w-4" />
                          {item.text}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="px-2 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
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
                        key: "reformas" as const,
                        show: showReformas,
                        node: (
                          <Link
                            href="/reformas"
                            className={mobileLinkClass}
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
                            onClick={handleMenuClose}
                          >
                            <PlusCircle className="h-4 w-4" />
                            {venderLabel}
                          </Link>
                        ),
                      },
                      {
                        key: "nosotros" as const,
                        show: hasNosotrosPage || isAccount129,
                        node: (
                          <Link
                            href="/nosotros"
                            className={mobileLinkClass}
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
                            onClick={handleMenuClose}
                          >
                            {blogLabel}
                          </Link>
                        ),
                      },
                      {
                        key: "contacto" as const,
                        show: true,
                        node: (
                          <Link
                            href="/contacto"
                            className={mobileLinkClass}
                            onClick={handleMenuClose}
                          >
                            Contacto
                          </Link>
                        ),
                      },
                    ].filter((entry) => entry.show),
                    navOrder,
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
