// Hardcoded brand overrides for account 129 (Guzmán del Pino).
// Lives in code (not DB) so admin UI edits to website_config can't wipe it.
// Mirrors structure/content of https://www.guzmandelpino.com/servicios.

import type { SocialLink } from "~/components/ui/social-links";

export const ACCOUNT_129_ID = "129";

export const ACCOUNT_129_SOCIAL_LINKS: SocialLink[] = [
  {
    platform: "instagram",
    url: "https://instagram.com/",
    previewImage:
      "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/social/instagram.png",
  },
  {
    platform: "tiktok",
    url: "https://tiktok.com/",
    previewImage:
      "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/social/tiktok.png",
  },
  {
    platform: "youtube",
    url: "https://youtube.com/",
    previewImage:
      "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/social/youtube.png",
  },
];

export const ACCOUNT_129_SERVICIOS = {
  hero: {
    videoUrl:
      "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/servicios/hero-video.mp4",
    imageUrl: undefined as string | undefined,
    title: "A vuestra disposición",
    subtitle:
      "Asesoramiento integral en compraventa, alquileres, valoraciones, obras y proyectos.",
    eyebrow: "Servicios",
  },
  services: [
    {
      title: "Venta y compra de propiedades",
      description:
        "Asesoramiento especializado para facilitar transacciones eficientes y seguras.",
      icon: "handshake",
      image:
        "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/servicios/venta-compra.jpg",
    },
    {
      title: "Alquileres",
      description:
        "Gestión integral de alquileres residenciales y comerciales.",
      icon: "key",
      image:
        "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/servicios/alquileres.jpg",
    },
    {
      title: "Valoraciones de Propiedades",
      description:
        "Evaluaciones precisas y detalladas para determinar el valor real de las propiedades, apoyadas por análisis técnicos y económicos.",
      icon: "calculator",
      image:
        "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/servicios/valoraciones.jpg",
    },
    {
      title: "Gestión y Contratación de obras",
      description:
        "Coordinación de proyectos de construcción y remodelación, asegurando calidad y cumplimiento de plazos.",
      icon: "hammer",
      image:
        "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/servicios/obras.jpg",
    },
    {
      title: "Topografía y Proyectos de Parcelación",
      description:
        "Servicios técnicos avanzados para el desarrollo y subdivisión de terrenos.",
      icon: "ruler",
      image:
        "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/129/website/servicios/topografia.jpg",
    },
  ],
} as const;

/**
 * True when we are rendering for this account.
 *
 * `accountId` is only passed by the CRM preview, which renders an ARBITRARY
 * account from this one deployment. Omitted everywhere else, where the
 * deployment's own env var is the right answer.
 */
export function isAccount129(accountId?: bigint | string): boolean {
  const id = accountId?.toString() ?? process.env.NEXT_PUBLIC_ACCOUNT_ID;
  return id === ACCOUNT_129_ID;
}
