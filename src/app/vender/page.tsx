import type { Metadata } from "next";
import { PropertyListingForm } from "~/components/property/property-listing-form";
import { BetterPlaceRatings } from "~/components/vender/betterplace-ratings";
import Footer from "~/components/footer";
import {
  isAccount155,
  ACCOUNT_155_BETTERPLACE_RATINGS_URL,
} from "~/lib/account-overrides/155";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

// For 155 this route is the valorador, not the listing page: the navbar's
// "Valorador" entry is the only link to /vender, so the page is just the
// valuation widget — no listing form, no second heading competing with it.
// Every other account keeps the standard "Publica tu inmueble" form.
const isValorador = isAccount155();

export const metadata: Metadata = {
  title: isValorador ? "Valorador" : "Vender tu Propiedad",
  description: isValorador
    ? "Descubre el valor de tu inmueble al instante y sin compromiso."
    : "Publica tu inmueble y llega a miles de compradores potenciales.",
  alternates: {
    canonical: `${baseUrl}/vender`,
  },
};

export default function VenderPage() {
  return (
    <>
      <div className="container mx-auto max-w-4xl px-4 py-16 sm:py-20 lg:py-24">
        {isValorador ? (
          // Bare widget: it ships with its own heading and copy, so the page
          // adds none of its own.
          <BetterPlaceRatings
            url={ACCOUNT_155_BETTERPLACE_RATINGS_URL}
            height={500}
          />
        ) : (
          <>
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
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
