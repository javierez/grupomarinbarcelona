import { getContactProps } from "~/server/queries/contact";
import { getSocialLinks } from "~/server/queries/social";
import { getFeaturesProps } from "~/server/queries/website-config";
import { getColorProps } from "~/server/queries/color";
import { Contacto } from "~/components/contact/contacto";

export async function ContactSection({
  accountId,
  titulo,
}: {
  accountId?: bigint;
  /** An own page's block title; unset → the contact title as on /contacto. */
  titulo?: string;
} = {}) {
  const [contactProps, socialLinks, features] = await Promise.all([
    getContactProps(accountId),
    getSocialLinks(accountId),
    getFeaturesProps(accountId),
  ]);
  // El color solo lo pide el panel de la portada editorial.
  const brandColor =
    features.siteStyle === "editorial" && contactProps?.image
      ? (await getColorProps(accountId))?.primaryColor
      : null;

  return (
    <Contacto
      contactProps={contactProps}
      socialLinks={socialLinks}
      features={features}
      brandColor={brandColor}
      titulo={titulo}
    />
  );
}
