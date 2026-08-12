import Link from "next/link";
import Image from "next/image";
import { Building } from "lucide-react";
import { SocialLinks, type SocialLink } from "~/components/ui/social-links";
import { getFooterProps } from "~/server/queries/footer";
import { getLogo } from "~/server/queries/logo";
import { getContactProps, type ContactProps } from "~/server/queries/contact";
import { OfficeLocationsSlider } from "~/components/footer/FooterSlider";
import { QuickLinksSection } from "~/components/footer/QuickLinksSection";
import { FooterLinkCards } from "~/components/footer/FooterLinkCards";
import { getColorProps } from "~/server/queries/color";
import { getFeaturesProps } from "~/server/queries/website-config";
import { getSocialLinks } from "~/server/queries/social";

// Build the quick links. The "vender" label is config-driven (features_props);
// default preserves prior copy.
function buildQuickLinks(venderLabel: string, alquilarLabel: string) {
  return [
    { text: "Inicio", href: "/" },
    { text: "Propiedades", href: "/venta-propiedades/todas-ubicaciones" },
    { text: "Nosotros", href: "/#about" },
    { text: "Contacto", href: "/#contact" },
    { text: "Comprar", href: "/comprar" },
    { text: alquilarLabel, href: "/alquilar" },
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
    features.menuLabels?.alquilar ?? "Alquilar",
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
  const socialByPlatform = new Map<SocialLink["platform"], SocialLink>();
  for (const link of await getSocialLinks(accountId)) {
    socialByPlatform.set(link.platform, link);
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

  // Aliseda-style: deep slate footer, brand color reserved for accents (not bg).
  // primaryColor is intentionally not used as background — it stays for hover accents.
  void colorProps;
  // Config-driven: when enabled, footer navigation is shown as cards and the
  // property-types column is dropped.
  const useFooterCards = features.footerCards === true;
  return (
    <footer className="bg-[hsl(219_22%_14%)] text-white/80">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main footer content */}
        <div className="py-16 sm:py-20 lg:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-4 lg:gap-12">
            {/* Company section */}
            <div className="md:col-span-2 lg:col-span-1">
              <Link href="/" className="mb-8 flex w-fit items-center gap-2">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={companyName}
                    width={240}
                    height={96}
                    className="h-14 w-auto object-contain brightness-0 invert sm:h-16"
                    priority
                  />
                ) : (
                  <>
                    <Building className="h-6 w-6 text-white" />
                    <span className="text-xl font-medium text-white">
                      <TextSlot field="companyName" value={companyName} />
                    </span>
                  </>
                )}
              </Link>
              <p className="mb-8 max-w-sm text-sm leading-relaxed text-white/60">
                <TextSlot field="description" value={description} />
              </p>
              {socialLinks.length > 0 && (
                <div className="pt-2">
                  <SocialLinks
                    links={socialLinks}
                    size="lg"
                    className="gap-4 text-white/80"
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
                />

                {/* Property types section */}
                <div>
                  <h3 className="mb-6 text-xs font-medium uppercase tracking-eyebrow text-white/50">
                    Tipos de Propiedades
                  </h3>
                  <nav>
                    <ul className="space-y-3">
                      {buyLinks
                        .filter(
                          (type) => propertyTypesVisibility[type.key] !== false,
                        )
                        .map((type: PropertyType, index: number) => (
                          <li key={index}>
                            <Link
                              href={type.href}
                              className="block text-sm text-white/70 transition-colors hover:text-white"
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
            <div className="md:col-span-2 lg:col-span-1">
              <h3 className="mb-6 text-xs font-medium uppercase tracking-eyebrow text-white/50">
                Nuestras Oficinas
              </h3>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6">
                <OfficeLocationsSlider officeLocations={officeLocations} />
              </div>
            </div>
          </div>
        </div>

        {legalBadges.length > 0 && (
          <div className="border-t border-white/10 py-8">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {legalBadges.map((badge, index) => {
                const img = (
                  <Image
                    src={badge.src}
                    alt={badge.alt}
                    width={320}
                    height={120}
                    className="h-14 w-auto rounded bg-white object-contain p-2 sm:h-16"
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
        <div className="border-t border-white/10 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="order-2 text-xs text-white/50 md:order-1">
              <TextSlot field="copyright" value={copyright} />
            </p>
            {LEGAL_LINKS.length > 0 && (
              <nav className="order-1 md:order-2">
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs md:justify-end">
                  {LEGAL_LINKS.map((link, index) => (
                    <Link
                      key={index}
                      href={link.href}
                      className="text-white/60 transition-colors hover:text-white"
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
