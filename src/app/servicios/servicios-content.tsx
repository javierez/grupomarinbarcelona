import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAboutProps } from "~/server/queries/about";
import { getFeaturesProps } from "~/server/queries/website-config";
import type { DescriptionAlign } from "~/lib/description-align";
import Footer from "~/components/footer";
import { DifferentiatorsSection } from "~/components/differentiators-section";
import { ServiciosHeroGrid } from "~/components/servicios/servicios-hero-grid";
import {
  ACCOUNT_129_SERVICIOS,
  isAccount129,
} from "~/lib/account-overrides/129";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

/**
 * `accountId` is only ever passed by the CRM live preview, which renders this
 * page for an agency that is not the one this deployment belongs to. Left
 * undefined — every real visit — each query falls back to NEXT_PUBLIC_ACCOUNT_ID
 * exactly as before.
 */
export async function ServiciosContent({
  accountId,
  live = false,
}: { accountId?: bigint; live?: boolean } = {}) {
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
  let descriptionAlign: DescriptionAlign;
  let services: Array<{
    title: string;
    description: string;
    // Optional to match AboutProps: services saved without an icon are real
    // (account 122 has three) and the grid renders them fine.
    icon?: string;
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
    descriptionAlign = features.descriptionAlign;
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero + grid are a client component so the CRM preview can follow an
          edit without reloading the frame. Account 129's hardcoded content is
          never live: there is nothing in the editor that could change it. */}
      <ServiciosHeroGrid
        initial={{
          pageTitle,
          pageSubtitle,
          heroVideoUrl,
          heroImageUrl,
          services: services.map((s) => ({
            ...s,
            bullets: s.bullets ? Array.from(s.bullets) : undefined,
          })),
        }}
        minimal={minimal}
        pageHeroSize={pageHeroSize}
        descriptionAlign={descriptionAlign}
        live={live && !useOverride}
      />

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
