import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAboutProps } from "~/server/queries/about";
import { getFeaturesProps } from "~/server/queries/website-config";
import Footer from "~/components/footer";
import { ExtendedServicesGrid } from "~/components/about/ExtendedServicesGrid";
import { DifferentiatorsSection } from "~/components/differentiators-section";
import { PageHeroBanner } from "~/components/page-hero-banner";
import {
  ACCOUNT_129_SERVICIOS,
  isAccount129,
} from "~/lib/account-overrides/129";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

/**
 * `accountId` is only ever passed by the CRM live preview, which renders this
 * page for an agency that is not the one this deployment belongs to. Left
 * undefined — every real visit — each query falls back to NEXT_PUBLIC_ACCOUNT_ID
 * exactly as before.
 */
export async function ServiciosContent({
  accountId,
}: { accountId?: bigint } = {}) {
  // Account 129: hardcoded content, immune to DB edits.
  // Other accounts: fall back to DB-driven about_props.extendedServices, or 404.
  const useOverride = isAccount129(accountId);

  let pageTitle: string;
  let pageSubtitle: string;
  let heroVideoUrl: string | undefined;
  let heroImageUrl: string | undefined;
  let minimal = false;
  let showServiciosCta = true;
  let contactoLabel = "Contáctanos";
  let pageHeroSize: "short" | "standard" | "full" = "standard";
  let services: Array<{
    title: string;
    description: string;
    icon: string;
    bullets?: readonly string[] | string[];
    ctaLabel?: string;
    ctaHref?: string;
  }>;

  if (useOverride) {
    const o = ACCOUNT_129_SERVICIOS;
    pageTitle = o.hero.title;
    pageSubtitle = o.hero.subtitle;
    heroVideoUrl = o.hero.videoUrl;
    heroImageUrl = o.hero.imageUrl;
    services = o.services.map((s) => ({ ...s }));
  } else {
    const [aboutProps, features] = await Promise.all([
      getAboutProps(accountId),
      getFeaturesProps(accountId),
    ]);
    // Availability: explicit features_props flag wins; otherwise fall back to the
    // presence of extended services. Content must exist to render either way.
    const extended = aboutProps?.extendedServices ?? [];
    const hasContent = extended.length > 0;
    const serviciosEnabled = features.pages?.servicios ?? hasContent;
    if (!serviciosEnabled || !hasContent) {
      notFound();
    }
    pageTitle = aboutProps?.servicesPageTitle ?? "Nuestros Servicios";
    pageSubtitle =
      aboutProps?.servicesPageSubtitle ??
      "Soluciones integrales para cualquier necesidad inmobiliaria, técnica o de obra.";
    heroVideoUrl = aboutProps?.servicesHeroVideo;
    heroImageUrl = aboutProps?.servicesHeroImage;
    services = extended;
    minimal = features.headerStyle === "minimal";
    showServiciosCta = features.serviciosCta !== false;
    contactoLabel = features.menuLabels?.contacto ?? "Contáctanos";
    pageHeroSize = features.pageHeroSize ?? "standard";
  }

  const hasHero = !!(heroVideoUrl || heroImageUrl);

  return (
    <main className="min-h-screen bg-background">
      {hasHero ? (
        <PageHeroBanner
          eyebrow="Servicios"
          title={pageTitle}
          subtitle={pageSubtitle}
          backgroundType={heroVideoUrl ? "video" : "image"}
          backgroundVideo={heroVideoUrl}
          backgroundImage={heroImageUrl}
          size={pageHeroSize}
        />
      ) : (
        <div className="container mx-auto px-4 pt-28 sm:pt-32">
          <header className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            {!minimal && (
              <span className="mb-5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                Servicios
              </span>
            )}
            <h1 className="mb-6 text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {pageTitle}
            </h1>
            {!minimal && (
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                {pageSubtitle}
              </p>
            )}
          </header>
        </div>
      )}

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <ExtendedServicesGrid
            services={services.map((s) => ({
              ...s,
              bullets: s.bullets ? Array.from(s.bullets) : undefined,
            }))}
          />
        </div>
      </section>

      {showServiciosCta && (
        <section className="py-20 sm:py-24">
          <div className="container mx-auto">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-6 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                ¿Qué servicio necesitas?
              </h2>
              <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Escríbenos y te orientamos sin compromiso.
              </p>
              <Link
                href="/contacto"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium uppercase tracking-eyebrow text-background transition-colors hover:bg-foreground/90"
              >
                {contactoLabel}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* "Lo que nos diferencia" — renders only for account 141 (Grupo Marín). */}
      <div className="container mx-auto px-4 sm:px-6">
        <DifferentiatorsSection />
      </div>

      <Footer accountId={accountId} />
    </main>
  );
}
