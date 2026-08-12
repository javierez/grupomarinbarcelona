import type { Metadata } from "next";
import { PropertyListingForm } from "~/components/property/property-listing-form";
import Footer from "~/components/footer";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export const metadata: Metadata = {
  title: "Vender tu Propiedad",
  description:
    "Publica tu inmueble y llega a miles de compradores potenciales.",
  alternates: {
    canonical: `${baseUrl}/vender`,
  },
};

export default function VenderPage() {
  return (
    <>
      <div className="container mx-auto max-w-4xl px-4 py-16 sm:py-20 lg:py-24">
        <header className="mb-12 text-center">
          <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Vender
          </span>
          <h1 className="mt-4 text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Publica tu inmueble
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Publica tu propiedad y llega a miles de compradores potenciales. Te acompañamos en cada paso.
          </p>
        </header>
        <PropertyListingForm />
      </div>
      <Footer />
    </>
  );
}
