import type { Metadata } from "next";
import { ContactSection } from "~/components/contact-section";
import Footer from "~/components/footer";
import { PageHeroBanner } from "~/components/page-hero-banner";
import { getContactProps } from "~/server/queries/contact";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Póngase en contacto con nuestro equipo de expertos inmobiliarios. Le ayudamos con la compra, venta y alquiler de propiedades.",
  alternates: {
    canonical: `${baseUrl}/contacto`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ContactoPage() {
  const contactProps = await getContactProps();
  const hasHero = !!(contactProps?.heroVideo || contactProps?.heroImage);

  return (
    <main className="min-h-screen bg-background">
      {hasHero && (
        <PageHeroBanner
          eyebrow="Contacto"
          title={contactProps?.heroTitle ?? contactProps?.title ?? "Hablemos"}
          subtitle={
            contactProps?.heroSubtitle ??
            contactProps?.subtitle ??
            "Estamos a un mensaje de distancia."
          }
          backgroundType={contactProps?.heroVideo ? "video" : "image"}
          backgroundVideo={contactProps?.heroVideo}
          backgroundImage={contactProps?.heroImage}
        />
      )}

      {/* Centered ContactSection */}
      <div
        className={
          hasHero
            ? "flex justify-center pt-12 sm:pt-16"
            : "flex justify-center pt-24 sm:pt-28 [&_section]:!pt-4 sm:[&_section]:!pt-6"
        }
      >
        <div className="w-full max-w-7xl">
          <ContactSection />
        </div>
      </div>
      <Footer />
    </main>
  );
}
