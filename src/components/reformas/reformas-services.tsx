"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  BeforeAfterGallery,
  BeforeAfterSlider,
} from "~/components/reformas/before-after";
import {
  ACCOUNT_141_REFORMAS_PHONE,
  ACCOUNT_141_REFORMAS_PHONE_DISPLAY,
  ACCOUNT_141_REFORMAS_SERVICES,
  type ReformaService,
} from "~/lib/account-overrides/141-reformas";

function BadgeIcon({
  name,
  className,
}: {
  name: ReformaService["badgeIcon"];
  className?: string;
}) {
  const Icon = name === "shield" ? ShieldCheck : Clock;
  return <Icon className={className} aria-hidden />;
}

/**
 * The three reforma services as cards; each opens a wide modal with the full
 * detail (antes/después slider, proceso, qué incluye, precio "desde").
 */
export function ReformasServices() {
  const [openId, setOpenId] = useState<ReformaService["id"] | null>(null);
  const active =
    ACCOUNT_141_REFORMAS_SERVICES.find((s) => s.id === openId) ?? null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {ACCOUNT_141_REFORMAS_SERVICES.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => setOpenId(service.id)}
            className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background text-left transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image
                src={service.image}
                alt={service.imageAlt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-foreground backdrop-blur">
                <BadgeIcon name={service.badgeIcon} className="h-3 w-3" />
                {service.timing}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-xl font-medium tracking-tight text-foreground">
                {service.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {service.tagline}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="text-sm font-semibold text-foreground">
                  {service.priceFrom}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-eyebrow text-brand">
                  Ver detalle
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        {/* Near full-bleed: pinned title + CTA, scrolling body between them, so
            the close button always sits on a clean surface and the CTA is
            never buried under a long page of detail. */}
        <DialogContent
          className="h-[92vh] max-h-none w-[96vw] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-xl p-0 sm:w-[95vw]"
          // Default autofocus lands on the first tab and scrolls the body past
          // the intro and price; keep focus on the dialog itself instead.
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement | null)?.focus();
          }}
        >
          {active && <ServiceDetail service={active} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ServiceDetail({ service }: { service: ReformaService }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The strongest content (antes/después detail, los 10 pasos) sits a full
  // screen below the fold, and a modal gives no outward sign it scrolls — so
  // cue it until the visitor scrolls once, then get out of the way.
  const [showCue, setShowCue] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const measure = () =>
      setShowCue(el.scrollTop < 16 && el.scrollHeight - el.clientHeight > 80);
    measure();
    // Watch the content, not the scroll container — the container's own box
    // never changes, but the content grows as the antes/después photos load.
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header className="border-b border-border/60 px-6 py-5 pr-14 sm:px-10">
        <DialogTitle className="text-2xl sm:text-3xl">
          {service.title}
        </DialogTitle>
      </header>

      <div className="relative min-h-0">
        <div
          ref={scrollRef}
          onScroll={(e) => {
            if (e.currentTarget.scrollTop > 16) setShowCue(false);
          }}
          className="h-full overflow-y-auto px-6 py-8 sm:px-10"
        >
          <div ref={contentRef} className="mx-auto max-w-[1500px]">
            {/* 1. Decide — what it is, what it costs, how long it takes. */}
            <DialogDescription className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              {service.intro}
            </DialogDescription>

            <dl className="mt-6 flex flex-wrap items-center gap-x-16 gap-y-3 border-y border-border/60 py-5">
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-eyebrow text-muted-foreground">
                  Precio
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  {service.priceFrom}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-medium uppercase tracking-eyebrow text-muted-foreground">
                  Plazo
                </dt>
                <dd className="mt-1 inline-flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <BadgeIcon
                    name={service.badgeIcon}
                    className="h-5 w-5 text-brand"
                  />
                  {service.timing}
                </dd>
              </div>
            </dl>

            {/* 2. Prove — the comparison, size-capped so the photo never
              dominates. 3. Detail — what's included, at what finish. */}
            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
              <div>
                <SectionHeading>Antes y después</SectionHeading>
                <BeforeAfterGallery pairs={service.beforeAfter} />
              </div>

              <div>
                <SectionHeading>Qué incluye</SectionHeading>
                <ul className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
                  {service.includes.map((item) => (
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

                {service.levels && (
                  <div className="mt-10">
                    <SectionHeading>Elige tu nivel de acabado</SectionHeading>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {service.levels.map((level) => (
                        <div
                          key={level.name}
                          className="rounded-lg border border-border/60 p-4"
                        >
                          <p className="text-xs font-medium uppercase tracking-eyebrow text-brand">
                            {level.name}
                          </p>
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                            {level.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {service.steps && (
              <ProcessBand
                steps={service.steps}
                title={service.stepsTitle ?? "El proceso, paso a paso"}
                note={service.stepsNote}
              />
            )}

            {service.highlight && (
              <section className="mt-12 rounded-xl border border-border bg-accent/60 p-6 sm:p-8">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
                  <BeforeAfterSlider pair={service.highlight.beforeAfter} />
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-background">
                      <Clock className="h-3 w-3" aria-hidden />
                      {service.highlight.timing}
                    </span>
                    <h4 className="mt-4 text-2xl font-medium tracking-tight text-foreground">
                      {service.highlight.title}
                    </h4>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {service.highlight.description}
                    </p>
                    <p className="mt-5 text-xl font-semibold text-foreground">
                      {service.highlight.priceFrom}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <ScrollCue visible={showCue} />
      </div>

      <footer className="flex flex-col gap-3 border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-center sm:px-10">
        <Link
          href="/contacto"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-10 py-3.5 text-sm font-medium uppercase tracking-eyebrow text-background transition-colors hover:bg-foreground/90"
        >
          Pide tu presupuesto
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <a
          href={`tel:+34${ACCOUNT_141_REFORMAS_PHONE}`}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Phone className="h-4 w-4" aria-hidden />
          {ACCOUNT_141_REFORMAS_PHONE_DISPLAY}
        </a>
      </footer>
    </>
  );
}

/**
 * Fade + chevron pinned to the bottom of the modal body: the fade proves the
 * content continues past the fold, the chevron asks for the scroll. Purely
 * decorative and click-through — it disappears the moment the visitor scrolls,
 * so it never nags, and it stays out of the tab order and the a11y tree.
 */
function ScrollCue({ visible }: { visible: boolean }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-28 items-end justify-center bg-gradient-to-t from-background via-background/85 to-transparent pb-4 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur motion-safe:animate-bounce">
        <ChevronDown className="h-4 w-4" strokeWidth={2} />
      </span>
    </div>
  );
}

/**
 * The 10-step reforma process, given its own full-width band — it's the single
 * strongest trust signal in the magazine, so it gets weight rather than being
 * a bullet list tucked under the photos.
 */
function ProcessBand({
  steps,
  title,
  note,
}: {
  steps: readonly string[];
  title: string;
  note?: string;
}) {
  return (
    <section className="mt-12 rounded-xl border border-border/60 bg-accent/50 p-6 sm:p-10">
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <span className="mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Del sueño al plano
          </span>
          <h4 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {title}
          </h4>
        </div>
        {note && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-[11px] font-medium uppercase tracking-eyebrow text-background">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {note}
          </span>
        )}
      </div>

      <ol className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {steps.map((step, i) => (
          <li key={step}>
            <span className="block text-4xl font-medium leading-none tracking-tight text-brand/70 sm:text-5xl">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mt-4 block h-px w-full bg-border" />
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              {step}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-5 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
      {children}
    </h4>
  );
}
