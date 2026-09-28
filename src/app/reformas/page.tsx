import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Phone } from "lucide-react";
import Footer from "~/components/footer";
import { ReformasServices } from "~/components/reformas/reformas-services";
import { isAccount141 } from "~/lib/account-overrides/141";
import {
  ACCOUNT_141_REFORMAS_COMMITMENTS,
  ACCOUNT_141_REFORMAS_CTA,
  ACCOUNT_141_REFORMAS_EXTRAS,
  ACCOUNT_141_REFORMAS_HERO,
  ACCOUNT_141_REFORMAS_PHONE,
  ACCOUNT_141_REFORMAS_PHONE_DISPLAY,
} from "~/lib/account-overrides/141-reformas";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Reformas",
  description:
    "Reformas integrales, cocinas y baños con presupuesto cerrado, plazo garantizado y financiación sin entrada. 35 años en Barcelona y el Maresme.",
  alternates: { canonical: `${baseUrl}/reformas` },
  robots: { index: true, follow: true },
};

/**
 * /reformas — hardcoded page for account 141 (Grupo Marín).
 * 404s for every other account, so the route is safe to keep in the shared app.
 */
export default function ReformasPage() {
  if (!isAccount141()) notFound();

  const hero = ACCOUNT_141_REFORMAS_HERO;
  const extras = ACCOUNT_141_REFORMAS_EXTRAS;
  const commitments = ACCOUNT_141_REFORMAS_COMMITMENTS;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero — editorial split: claim on the left, staggered collage on the right */}
      <section className="container mx-auto px-4 pt-28 sm:px-6 sm:pt-32">
        <div className="grid grid-cols-1 items-center gap-12 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="mb-5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              {hero.eyebrow}
            </span>
            <h1 className="text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {hero.subtitle}
            </p>

            {/* Facts, not promises — the promises live in "Nuestro compromiso" */}
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
              {hero.stats.map((stat) => (
                <div key={stat.label} className="max-w-[9rem]">
                  <dt className="text-4xl font-medium leading-none tracking-tight text-brand">
                    {stat.value}
                  </dt>
                  <dd className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#servicios"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-7 py-3.5 text-sm font-medium uppercase tracking-eyebrow text-background transition-colors hover:bg-foreground/90"
              >
                Ver reformas
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={`tel:+34${ACCOUNT_141_REFORMAS_PHONE}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {ACCOUNT_141_REFORMAS_PHONE_DISPLAY}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Tall shot stretches to match the two stacked ones beside it. */}
            <div className="relative col-span-1 row-span-2 min-h-[240px] overflow-hidden rounded-xl bg-muted">
              <Image
                src={hero.collage[0].src}
                alt={hero.collage[0].alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 45vw, 280px"
                priority
                unoptimized
              />
            </div>
            {hero.collage.slice(1).map((shot) => (
              <div
                key={shot.src}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 45vw, 280px"
                  unoptimized
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The three services */}
      <section id="servicios" className="scroll-mt-24 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Elige tu reforma
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Ábrelas para arrastrar el antes y el después, y ver el proceso, el
              plazo y qué incluye.
            </p>
          </div>
          <ReformasServices />
        </div>
      </section>

      {/* Commitments */}
      <section className="bg-accent/40 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {commitments.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {commitments.subtitle}
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-3">
            {commitments.groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-5 border-b border-border/60 pb-3 text-xs font-medium uppercase tracking-eyebrow text-foreground">
                  {group.title}
                </h3>
                <ul className="space-y-4">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 text-sm text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Otros servicios */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {extras.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {extras.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {extras.items.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-xl border border-border/60 bg-background"
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-6 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {ACCOUNT_141_REFORMAS_CTA.title}
            </h2>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {ACCOUNT_141_REFORMAS_CTA.subtitle}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-8 py-4 text-sm font-medium uppercase tracking-eyebrow text-background transition-colors hover:bg-foreground/90"
              >
                Pide tu presupuesto
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={`tel:+34${ACCOUNT_141_REFORMAS_PHONE}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-4 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {ACCOUNT_141_REFORMAS_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
