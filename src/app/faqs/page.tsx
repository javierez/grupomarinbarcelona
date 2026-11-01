import type { Metadata } from "next";
import { FaqsContent } from "./faqs-content";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Preguntas Frecuentes (FAQs)",
  description:
    "Encuentra respuestas a las preguntas más comunes sobre compra, venta y alquiler de propiedades. Resolvemos tus dudas inmobiliarias.",
  alternates: {
    canonical: `${baseUrl}/faqs`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Next validates a page's default export against its own PageProps and
 * forbids any other export, so the account-aware body lives in
 * `FaqsContent`. Real visits render the deployment's own account; the CRM
 * preview imports that component directly and passes the account it is
 * previewing.
 */
export default async function Page() {
  return <FaqsContent />;
}
