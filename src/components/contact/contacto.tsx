import type { SocialLink } from "~/components/ui/social-links";
import type { ContactProps } from "~/server/queries/contact";
import type { FeaturesProps } from "~/server/queries/website-config";
import { ContactBrandBanner } from "./ContactBrandBanner";
import { ContactContent } from "./ContactContent";

/**
 * «Contacto» de la portada, ya con sus datos. La pintan la web
 * (`contact-section.tsx`) y la vista previa del CRM: la vista previa tenía su
 * copia sin el Instagram, sin «respondemos en 24 h» y sin el panel editorial,
 * y cinco agencias veían en el editor otro contacto que en su web (17-nov-2026).
 */
export function Contacto({
  contactProps,
  socialLinks,
  features,
  brandColor,
  titulo,
}: {
  contactProps: ContactProps | null;
  socialLinks: SocialLink[];
  features: FeaturesProps;
  /** El color de la marca: solo lo pide el panel de la portada editorial. */
  brandColor?: string | null;
  /** An own page's block title; unset → the contact title as on /contacto. */
  titulo?: string;
}) {
  const instagramUrl = socialLinks.find((s) => s.platform === "instagram")?.url;
  const linkedinUrl = socialLinks.find((s) => s.platform === "linkedin")?.url;

  // Fallbacks in case data is missing. The contact label is config-driven.
  const title =
    titulo ?? (features.menuLabels?.contacto || contactProps?.title || "Contáctanos");
  const subtitle =
    contactProps?.subtitle ||
    "¿Tienes preguntas o estás listo para dar el siguiente paso? Nuestro equipo está aquí para ayudarte con todas tus necesidades inmobiliarias.";

  // Editorial style: brand panel with the premises photo above the form.
  const panel = features.siteStyle === "editorial" && brandColor ? contactProps?.image : null;

  return (
    <>
      {panel && brandColor && (
        <ContactBrandBanner contactProps={contactProps} brandColor={brandColor} image={panel} />
      )}
      <ContactContent
        title={title}
        subtitle={subtitle}
        messageForm={contactProps?.messageForm ?? true}
        address={contactProps?.address ?? true}
        phone={contactProps?.phone ?? true}
        mail={contactProps?.mail ?? true}
        schedule={contactProps?.schedule ?? true}
        map={contactProps?.map ?? true}
        contactProps={contactProps}
        instagramUrl={instagramUrl}
        linkedinUrl={linkedinUrl}
        respuesta24h={features.respuesta24h === true}
      />
    </>
  );
}
