import { getContactProps } from "~/server/queries/contact";
import { getSocialLinks } from "~/server/queries/social";
import { getFeaturesProps } from "~/server/queries/website-config";
import { getColorProps } from "~/server/queries/color";
import { ContactContent } from "~/components/contact/ContactContent";
import { ContactBrandBanner } from "~/components/contact/ContactBrandBanner";

export async function ContactSection({
  accountId,
}: { accountId?: bigint } = {}) {
  const [contactProps, socialLinks, features] = await Promise.all([
    getContactProps(accountId),
    getSocialLinks(accountId),
    getFeaturesProps(accountId),
  ]);
  const instagramUrl = socialLinks.find((s) => s.platform === "instagram")?.url;
  const linkedinUrl = socialLinks.find((s) => s.platform === "linkedin")?.url;

  // Fallbacks in case data is missing. The contact label is config-driven.
  const title =
    features.menuLabels?.contacto || contactProps?.title || "Contáctanos";
  const subtitle =
    contactProps?.subtitle ||
    "¿Tienes preguntas o estás listo para dar el siguiente paso? Nuestro equipo está aquí para ayudarte con todas tus necesidades inmobiliarias.";
  const messageForm = contactProps?.messageForm ?? true;
  const address = contactProps?.address ?? true;
  const phone = contactProps?.phone ?? true;
  const mail = contactProps?.mail ?? true;
  const schedule = contactProps?.schedule ?? true;
  const map = contactProps?.map ?? true;

  // Editorial style: brand panel with the premises photo above the form.
  const brandColor =
    features.siteStyle === "editorial" && contactProps?.image
      ? (await getColorProps(accountId))?.primaryColor
      : null;

  return (
    <>
      {brandColor && contactProps?.image && (
        <ContactBrandBanner
          contactProps={contactProps}
          brandColor={brandColor}
          image={contactProps.image}
        />
      )}
      <ContactContent
        title={title}
        subtitle={subtitle}
        messageForm={messageForm}
        address={address}
        phone={phone}
        mail={mail}
        schedule={schedule}
        map={map}
        contactProps={contactProps}
        instagramUrl={instagramUrl}
        linkedinUrl={linkedinUrl}
      />
    </>
  );
}
