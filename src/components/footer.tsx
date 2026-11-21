import Link from "next/link";
import Image from "next/image";
import { Building } from "lucide-react";
import { SocialLinks, type SocialLink } from "~/components/ui/social-links";
import { getFooterProps } from "~/server/queries/footer";
import { getLogo } from "~/server/queries/logo";
import { getContactProps, type ContactProps } from "~/server/queries/contact";
import { OfficeLocationsSlider } from "~/components/footer/FooterSlider";
import { QuickLinksSection } from "~/components/footer/QuickLinksSection";
import { FooterHeading, footerLinkClass, footerListClass } from "~/components/footer/footer-v1";
import { FooterLinkCards } from "~/components/footer/FooterLinkCards";
import { getColorProps } from "~/server/queries/color";
import { getFeaturesProps } from "~/server/queries/website-config";
import { getSocialLinks } from "~/server/queries/social";
import { FooterV3 } from "~/components/v3/footer-v3";
import { readableForegroundHsl, tintaSobrePrimario } from "~/lib/utils";
import { ACCOUNT_137_FOOTER_TYPES, isAccount137 } from "~/lib/account-overrides/137";

// Build the quick links. The "vender" label is config-driven (features_props);
// default preserves prior copy.
function buildQuickLinks(venderLabel: string, alquilarLabel: string) {
  return [
    { text: "Inicio", href: "/" },
    { text: "Propiedades", href: "/venta-propiedades/todas-ubicaciones" },
    { text: "Nosotros", href: "/#about" },
    { text: "Contacto", href: "/#contact" },
    // Las rutas canónicas del buscador. "/alquilar" no empieza por
    // "alquiler", así que abría "Propiedades en Venta".
    { text: "Comprar", href: "/venta-propiedades/todas-ubicaciones" },
    { text: alquilarLabel, href: "/alquiler-propiedades/todas-ubicaciones" },
    { text: venderLabel, href: "/vender" },
  ];
}

const LEGAL_LINKS = [
  { text: "Aviso Legal", href: "/aviso-legal" },
  { text: "Preguntas frecuentes (FAQs)", href: "/faqs" },
  { text: "Contacta con nosotros", href: "/contacto" },
  { text: "Protección de datos", href: "/proteccion-de-datos" },
  { text: "Política de cookies", href: "/cookies" },
  { text: "Enlaces de interés", href: "/enlaces-de-interes" },
] as const;

const buyLinks = [
  {
    key: "pisos",
    text: "Pisos en venta",
    href: "/venta-pisos/todas-ubicaciones",
  },
  {
    key: "casas",
    text: "Casas en venta",
    href: "/venta-casas/todas-ubicaciones",
  },
  {
    key: "locales",
    text: "Locales en venta",
    href: "/venta-locales/todas-ubicaciones",
  },
  {
    key: "solares",
    text: "Terrenos en venta",
    href: "/venta-solares/todas-ubicaciones",
  },
  {
    key: "garajes",
    text: "Garajes en venta",
    href: "/venta-garajes/todas-ubicaciones",
  },
  {
    key: "naves",
    text: "Naves en venta",
    href: "/venta-naves-industriales/todas-ubicaciones",
  },
];

// type QuickLink = { text: string; href: string; };
type PropertyType = (typeof buyLinks)[number];

// Helper function to convert contact props offices to footer format
function transformContactOffices(contactProps: ContactProps | null): Array<{
  name: string;
  address: string[];
  phone: string;
  email: string;
}> {
  if (!contactProps?.offices) return [];

  return contactProps.offices.map((office) => ({
    name: office.name,
    address: [
      office.address.street,
      `${office.address.city}, ${office.address.state}`,
      office.address.country,
    ].filter(Boolean),
    phone: office.phoneNumbers.main,
    email: office.emailAddresses.info,
  }));
}

/**
 * Seam for the CRM live preview. Production leaves it as the plain span, so the
 * three strings render exactly as before and none of the preview code is
 * bundled into an agency's site; `/preview/home` passes a client component that
 * follows the editor.
 *
 * A COMPONENT and not a `(field, value) => ReactNode` callback: a function
 * exported from a `"use client"` module is a client reference, and the server
 * cannot call it — only render it. Doing it the other way threw
 * "Attempted to call previewFooterText() from the server".
 */
export type FooterTextField = "companyName" | "description" | "copyright";
export type FooterTextComponent = React.ComponentType<{
  field: FooterTextField;
  value: string;
}>;

function PlainFooterText({ value }: { field: FooterTextField; value: string }) {
  return <>{value}</>;
}

export default async function Footer({
  accountId,
  TextSlot = PlainFooterText,
}: { accountId?: bigint; TextSlot?: FooterTextComponent } = {}) {
  const footerProps = await getFooterProps(accountId);
  const contactProps = await getContactProps(accountId);
  const logoUrl = await getLogo(accountId);
  const colorProps = await getColorProps(accountId);
  const features = await getFeaturesProps(accountId);
  const quickLinks = buildQuickLinks(
    features.menuLabels?.vender ?? "Vender",
    // La v1 ponía «Alquilar» fijo en el pie, aunque el menú lo quitara
    // (Ecogar lo tiene vacío en el menú y en su pie sale).
    features.aspectoV1 === true
      ? "Alquilar"
      : (features.menuLabels?.alquilar ?? "Alquilar"),
  );

  // Fallbacks in case data is missing
  const companyName = footerProps?.companyName || "Inmobiliaria";
  const description =
    footerProps?.description ||
    "Tu socio de confianza para encontrar la propiedad perfecta.";

  // Convert social links object to array format - no fallbacks
  const socialLinksObj = footerProps?.socialLinks;
  const supportedPlatforms: SocialLink["platform"][] = [
    "facebook",
    "twitter",
    "instagram",
    "linkedin",
    "youtube",
    "tiktok",
  ];
  const footerSocialLinks: SocialLink[] = socialLinksObj
    ? Object.entries(socialLinksObj)
        .filter(([_, url]) => url && url.trim() !== "")
        .filter(([platform]) =>
          supportedPlatforms.includes(
            platform.toLowerCase() as SocialLink["platform"],
          ),
        )
        .map(([platform, url]) => ({
          platform: platform.toLowerCase() as SocialLink["platform"],
          url: url,
        }))
    : [];
  // footer_props keeps its own copy of the social links, which drifts out of
  // sync with the main "Redes Sociales" config (a network added there never
  // reaches the footer). Merge both so the footer always shows every configured
  // network; footer_props wins on URL for the platforms it does define.
  // v1 (`aspectoV1`) only ever showed footer_props: merging would add icons
  // its sites never had (ECOGAR, 19-nov-2026: four, under the logo).
  const socialByPlatform = new Map<SocialLink["platform"], SocialLink>();
  if (features.aspectoV1 !== true) {
    for (const link of await getSocialLinks(accountId)) {
      socialByPlatform.set(link.platform, link);
    }
  }
  for (const link of footerSocialLinks) {
    socialByPlatform.set(link.platform, link);
  }
  const socialLinks: SocialLink[] = [...socialByPlatform.values()];

  // Use contact props offices as primary source, fallback to footer props
  const contactOffices = transformContactOffices(contactProps);
  const officeLocations =
    contactOffices.length > 0
      ? contactOffices
      : footerProps?.officeLocations || [];
  const quickLinksVisibility = footerProps?.quickLinksVisibility || {};
  const propertyTypesVisibility = footerProps?.propertyTypesVisibility || {};
  const legalBadges = footerProps?.legalBadges ?? [];
  const copyright =
    footerProps?.copyright ||
    `© ${new Date().getFullYear()} ${companyName}. Todos los derechos reservados.`;

  if (features.footerStyle === "v3") {
    return (
      <FooterV3
        companyName={companyName}
        logoUrl={logoUrl}
        socialLinks={socialLinks}
        offices={officeLocations}
        copyright={copyright}
      />
    );
  }

  // Pizarra oscura con texto blanco. Con footerBrand se pinta con primaryColor
  // y el texto sale por contraste: oscuro sobre un primario claro, blanco sobre
  // uno oscuro. La variable del body (--brand-primary-foreground) la cambia el
  // borrador en vivo; el logo, al recargar.
  // footerTint es el pie de v1, y gana a footerBrand: claro, con el 20 % del
  // primario (sin primario, el gris suave de v1), texto oscuro y el logo en
  // sus colores.
  const claro = features.footerTint === true;
  // Ana Díaz (137): su pie de la v1 es el gris suave, porque allí su naranja
  // iba en código y no en color_props; aquí lo lleva (§6) para la barra.
  const tinte = claro && !isAccount137(accountId) ? colorProps?.primaryColor : undefined;
  const primario = !claro && features.footerBrand ? colorProps?.primaryColor : undefined;
  const logoOscuro = !!primario && readableForegroundHsl(primario) === "0 0% 9%";
  // Ana Díaz (137): todos los tipos, en dos columnas (v1).
  const acct137 = isAccount137(accountId);
  // La v1 de El Mito (`v1Inicial`): «Solares», sin naves ni enlaces de interés.
  const inicial = features.v1Inicial === true;
  const tiposDelPie = acct137
    ? ACCOUNT_137_FOOTER_TYPES
    : inicial
      ? buyLinks
          .filter((l) => l.key !== "naves")
          .map((l) => (l.key === "solares" ? { ...l, text: "Solares en venta" } : l))
      : buyLinks;
  const enlacesLegales = inicial
    ? LEGAL_LINKS.filter((l) => l.href !== "/enlaces-de-interes")
    : LEGAL_LINKS;
  // Config-driven: when enabled, footer navigation is shown as cards and the
  // property-types column is dropped.
  const useFooterCards = features.footerCards === true;
  // v1 look: underlined bold column titles, larger links, a white office card.
  const v1 = features.aspectoV1 === true;
  return (
    <footer
      data-vesta="pie"
      className={
        claro
          ? `border-t border-border/40 text-tinta/80${tinte ? "" : " bg-gradient-to-b from-muted/30 via-muted/50 to-muted"}`
          : "bg-[hsl(219_22%_14%)] text-tinta/80"
      }
      style={
        {
          ...(primario ? { backgroundColor: `var(--brand-primary, ${primario})` } : {}),
          ...(tinte
            ? { backgroundColor: `color-mix(in srgb, var(--brand-primary, ${tinte}) 20%, transparent)` }
            : {}),
          "--tinta": claro
            ? "var(--foreground)"
            : primario
              ? tintaSobrePrimario(primario)
              : "0 0% 100%",
        } as React.CSSProperties
      }
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main footer content */}
        <div className={v1 ? "py-12 sm:py-16 lg:py-20" : "py-16 sm:py-20 lg:py-24"}>
          <div
            className={
              v1
                ? "grid gap-8 sm:gap-12 md:grid-cols-2 md:gap-16 lg:grid-cols-4 lg:gap-20"
                : "grid gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:gap-12"
            }
          >
            {/* Company section */}
            <div
              className={
                v1
                  ? "md:col-span-2 lg:col-span-1 lg:border-r lg:border-border/40 lg:pr-16"
                  : "md:col-span-2 lg:col-span-1"
              }
            >
              <Link href="/" className="mb-8 flex w-fit items-center gap-2">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={companyName}
                    width={240}
                    height={96}
                    className={
                      claro
                        ? // El logo del pie de la v1, más grande (lg:h-28).
                          "h-16 w-auto object-contain sm:h-20 lg:h-28"
                        : `h-14 w-auto object-contain brightness-0 sm:h-16${logoOscuro ? "" : " invert"}`
                    }
                    priority
                  />
                ) : (
                  <>
                    <Building className="h-6 w-6 text-tinta" />
                    <span className="text-xl font-medium text-tinta">
                      <TextSlot field="companyName" value={companyName} />
                    </span>
                  </>
                )}
              </Link>
              <p
                className={`mb-8 max-w-sm ${v1 ? "text-base text-muted-foreground" : "text-sm text-tinta/60"} leading-relaxed`}
                data-vesta="pie.descripcion"
              >
                <TextSlot field="description" value={description} />
              </p>
              {socialLinks.length > 0 && (
                <div className="pt-2" data-vesta="pie.redes">
                  <SocialLinks
                    links={socialLinks}
                    size="lg"
                    className={v1 ? "gap-4" : "gap-4 text-tinta/80"}
                  />
                </div>
              )}
            </div>

            {useFooterCards ? (
              /* Account 139: quick links as cards, no property-types column */
              <FooterLinkCards
                links={quickLinks}
                visibility={quickLinksVisibility}
                className="md:col-span-2 lg:col-span-2"
              />
            ) : (
              <>
                {/* Quick links section */}
                <QuickLinksSection
                  links={quickLinks}
                  visibility={quickLinksVisibility}
                  v1={v1}
                />

                {/* Property types section */}
                <div className={v1 ? "lg:pl-8" : undefined}>
                  <FooterHeading v1={v1}>Tipos de Propiedades</FooterHeading>
                  <nav>
                    <ul className={acct137 ? "grid grid-cols-2 gap-x-6 gap-y-3" : footerListClass(v1)}>
                      {tiposDelPie
                        .filter(
                          (type) => propertyTypesVisibility[type.key] !== false,
                        )
                        .map((type: PropertyType, index: number) => (
                          <li key={index}>
                            <Link
                              href={type.href}
                              className={footerLinkClass(v1)}
                            >
                              {type.text}
                            </Link>
                          </li>
                        ))}
                    </ul>
                  </nav>
                </div>
              </>
            )}

            {/* Office locations section */}
            <div className={v1 ? "md:col-span-2 lg:col-span-1 lg:pl-8" : "md:col-span-2 lg:col-span-1"}>
              <FooterHeading v1={v1}>
                {v1
                  ? "Nuestras Oficinas"
                  : officeLocations.length === 1
                    ? "Nuestra oficina"
                    : "Nuestras oficinas"}
              </FooterHeading>
              <div
                className={
                  v1
                    ? "rounded-xl border border-border/40 bg-card/50 p-6 shadow-sm transition-all duration-300 hover:shadow-md"
                    : "rounded-lg border border-tinta/10 bg-tinta/5 p-6"
                }
              >
                <OfficeLocationsSlider officeLocations={officeLocations} v1={v1} />
              </div>
            </div>
          </div>
        </div>

        {legalBadges.length > 0 && (
          <div className="border-t border-tinta/10 py-8">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {legalBadges.map((badge, index) => {
                const img = (
                  <Image
                    src={badge.src}
                    alt={badge.alt}
                    width={badge.wide ? 1280 : 320}
                    height={120}
                    sizes={badge.wide ? "(max-width: 896px) 100vw, 896px" : undefined}
                    className={
                      badge.wide
                        ? "h-auto w-full max-w-4xl rounded bg-white object-contain p-2 sm:p-3"
                        : "h-14 w-auto rounded bg-white object-contain p-2 sm:h-16"
                    }
                  />
                );
                return badge.href ? (
                  <Link
                    key={index}
                    href={badge.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={badge.alt}
                  >
                    {img}
                  </Link>
                ) : (
                  <div key={index} aria-label={badge.alt}>
                    {img}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom section */}
        <div className={v1 ? "border-t border-border/40 py-6 sm:py-8 lg:py-10" : "border-t border-tinta/10 py-8"}>
          <div
            className={
              v1
                ? "flex flex-col items-center justify-between gap-4 sm:gap-6 md:flex-row lg:gap-8"
                : "flex flex-col items-center justify-between gap-4 md:flex-row"
            }
          >
            <p
              className={`order-2 md:order-1 ${v1 ? "text-sm font-medium text-muted-foreground" : "text-xs text-tinta/50"}`}
              data-vesta="pie.copyright"
            >
              <TextSlot field="copyright" value={copyright} />
            </p>
            {enlacesLegales.length > 0 && (
              <nav className="order-1 md:order-2">
                <div
                  className={
                    v1
                      ? "flex flex-wrap justify-center gap-4 text-sm sm:gap-6 md:justify-end lg:gap-8"
                      : "flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs md:justify-end"
                  }
                >
                  {enlacesLegales.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className={
                        v1
                          ? "font-medium text-muted-foreground transition-all duration-300 hover:font-semibold hover:text-primary"
                          : "text-tinta/60 transition-colors hover:text-tinta"
                      }
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </nav>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
