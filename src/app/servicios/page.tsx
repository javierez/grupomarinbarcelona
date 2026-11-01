import type { Metadata } from "next";
import { ServiciosContent } from "./servicios-content";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Asesoramiento integral en compraventa, alquileres, valoraciones, obras y proyectos.",
  alternates: { canonical: `${baseUrl}/servicios` },
  robots: { index: true, follow: true },
};

/**
 * Next validates a page's default export against its own PageProps and
 * forbids any other export, so the account-aware body lives in
 * `ServiciosContent`. Real visits render the deployment's own account; the CRM
 * preview imports that component directly and passes the account it is
 * previewing.
 */
export default async function Page() {
  return <ServiciosContent />;
}
