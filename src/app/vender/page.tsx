import type { Metadata } from "next";
import { BadgeEuro, Home, Zap } from "lucide-react";
import { PropertyListingForm } from "~/components/property/property-listing-form";
import { BetterPlaceRatings } from "~/components/vender/betterplace-ratings";
import { PageHeroBanner } from "~/components/page-hero-banner";
import Footer from "~/components/footer";
import {
  isAccount155,
  ACCOUNT_155_BETTERPLACE_RATINGS_URL,
  ACCOUNT_155_VALORADOR,
} from "~/lib/account-overrides/155";
import { getHeroProps } from "~/server/queries/hero";
import { resolveHeroMedia } from "~/lib/hero-media";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

// For 155 this route is the valorador, not the listing page: the navbar's
// "Valorador" entry is the only link to /vender, so the page is built around
// the valuation widget — no listing form competing with it.
// Every other account keeps the standard "Publica tu inmueble" form.
const isValorador = isAccount155();

const POINT_ICONS = { "badge-euro": BadgeEuro, zap: Zap, home: Home } as const;

export const metadata: Metadata = {
  title: isValorador ? "Valorador" : "Vender tu Propiedad",
  description: isValorador
    ? "Descubre el valor de tu inmueble al instante y sin compromiso."
    : "Publica tu inmueble y llega a miles de compradores potenciales.",
  alternates: {
    canonical: `${baseUrl}/vender`,
  },
};

async function Valorador() {
  const { hero, points } = ACCOUNT_155_VALORADOR;
  // Same backdrop as the homepage, so the valorador reads as part of the site.
  const [media] = resolveHeroMedia(await getHeroProps());

  return (
    <main className="bg-background">
      <PageHeroBanner
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        size="short"
        backgroundType={media?.type === "video" ? "video" : "image"}
        backgroundVideo={media?.type === "video" ? media.url : undefined}
        backgroundImage={media?.type === "image" ? media.url : undefined}
      />

      <div className="container mx-auto max-w-4xl px-4">
        {/* The widget ships its own heading and grey panel; the card only
            clips it to the site's corners so it no longer floats on a blank
            page. No padding: a white frame around the grey read as two boxes. */}
        <div className="relative z-10 -mt-12 overflow-hidden rounded-xl border border-border/60 bg-background sm:-mt-16">
          <BetterPlaceRatings url={ACCOUNT_155_BETTERPLACE_RATINGS_URL} height={460} />
        </div>
      </div>

      <section className="py-16 sm:py-20">
        <div className="container mx-auto grid max-w-5xl grid-cols-1 gap-x-8 gap-y-10 px-4 sm:grid-cols-3">
          {points.map((point) => {
            const Icon = POINT_ICONS[point.icon];
            return (
              <div key={point.lead} className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-background">
                  <Icon className="h-7 w-7 text-brand" strokeWidth={1.5} />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground">{point.lead}</span>{" "}
                  {point.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default async function VenderPage() {
  if (isValorador) {
    return (
      <>
        <Valorador />
        <Footer />
      </>
    );
  }

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
