import type { Metadata } from "next";
import { ContactSection } from "~/components/contact-section";
import Footer from "~/components/footer";
import { PageHeroBanner } from "~/components/page-hero-banner";
import BreadcrumbJsonLd from "~/components/breadcrumb-json-ld";
import { getContactProps } from "~/server/queries/contact";
import { getFeaturesProps } from "~/server/queries/website-config";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Póngase en contacto con nuestro equipo de expertos inmobiliarios. Le ayudamos en todo el proceso, de principio a fin.",
  alternates: {
    canonical: `${baseUrl}/contacto`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function ContactoPage() {
  const [contactProps, features] = await Promise.all([getContactProps(), getFeaturesProps()]);
  const hasHero = !!(contactProps?.heroVideo || contactProps?.heroImage);
  // `contactoCabecera`: without a hero, the v1 H1 and breadcrumbs (SEO).
  const cabecera = !hasHero && features.contactoCabecera === true;
  // `aspectoV1`: v1's bold H1 and its spacing.
  const v1 = features.aspectoV1 === true;

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
          vesta={{
            titulo: "contacto.pagina-titulo",
            subtitulo: "contacto.pagina-subtitulo",
            fondo: contactProps?.heroVideo ? "contacto.pagina-video" : "contacto.pagina-imagen",
          }}
        />
      )}

      {cabecera && (
        <>
          <BreadcrumbJsonLd
            siteUrl={baseUrl}
            items={[
              { name: "Inicio", href: "/" },
              { name: "Contacto", href: "/contacto" },
            ]}
          />
          <div className={v1 ? "container mx-auto px-4 py-8" : "container mx-auto px-4 pt-24 sm:pt-28"}>
            <h1
              className={
                v1
                  ? "mb-2 text-3xl font-bold tracking-tight sm:text-4xl"
                  : "mb-2 text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
              }
            >
              Contacto
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Póngase en contacto con nuestro equipo. Le ayudamos con la compra,
              venta y alquiler de propiedades.
            </p>
          </div>
        </>
      )}

      {/* Centered ContactSection */}
      <div
        className={
          hasHero
            ? "flex justify-center pt-12 sm:pt-16"
            : cabecera && v1
              ? "flex justify-center"
              : cabecera
              ? "flex justify-center pt-8 [&_section]:!pt-4 sm:[&_section]:!pt-6"
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
