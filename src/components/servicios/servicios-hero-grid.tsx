"use client";

import { useEffect, useState } from "react";
import { ExtendedServicesGrid } from "~/components/about/ExtendedServicesGrid";
import { ServicesIconList } from "~/components/about/ServicesIconList";
import { PageHeroBanner } from "~/components/page-hero-banner";
import type { DescriptionAlign } from "~/lib/description-align";
import {
  announceReady,
  readPreviewMessage,
  slice,
} from "~/app/preview/[section]/preview-patch";

/** Slice names the editor sends. Order matters: the first is the bare shape. */
const KEYS = ["aboutProps"] as const;

export interface ServicioItem {
  title: string;
  description: string;
  icon?: string;
  image?: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
}

export interface ServiciosView {
  pageTitle: string;
  pageSubtitle: string;
  heroVideoUrl?: string;
  heroImageUrl?: string;
  services: ServicioItem[];
}

/** The slice of `about_props` the Servicios tab edits. */
interface ServiciosAboutProps {
  servicesPageTitle?: string;
  servicesPageSubtitle?: string;
  servicesHeroVideo?: string;
  servicesHeroImage?: string;
  extendedServices?: ServicioItem[];
}

const DEFAULT_TITLE = "Nuestros Servicios";
const DEFAULT_SUBTITLE =
  "Soluciones integrales para cualquier necesidad inmobiliaria, técnica o de obra.";

/**
 * The hero and the grid of /servicios — everything on the page the Servicios
 * tab can actually change.
 *
 * Split out of `ServiciosContent`, a server component that could never follow
 * an edit: the agency rewrote a service and the preview kept showing the saved
 * one until it reloaded the frame. The CTA, "lo que nos diferencia" and the
 * footer stay around this on the server, since nothing in this tab touches them.
 *
 * `live` keeps the listener off the public site, which renders the same markup.
 */
export function ServiciosHeroGrid({
  initial,
  minimal,
  pageHeroSize,
  descriptionAlign,
  servicesStyle,
  serviciosLayout,
  tarjetaV1,
  live = false,
}: {
  initial: ServiciosView;
  minimal: boolean;
  pageHeroSize: "short" | "standard" | "full";
  descriptionAlign?: DescriptionAlign;
  /** `features_props.servicesStyle`; "icons" swaps the cards for the two-column list. */
  servicesStyle?: "cards" | "icons";
  /** `features_props.serviciosLayout`; "stacked" → one wide card per row. */
  serviciosLayout?: string;
  /** The v1 service card (`aspectoV1`), see ExtendedServicesGrid. */
  tarjetaV1?: "justificada" | "plana";
  live?: boolean;
}) {
  const [view, setView] = useState<ServiciosView>(initial);

  useEffect(() => {
    if (!live) return;
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e.data, "servicios");
      if (!msg) return;
      const next = slice<ServiciosAboutProps>(msg.patch, "aboutProps", KEYS);
      if (!next) return;
      setView({
        pageTitle: next.servicesPageTitle ?? DEFAULT_TITLE,
        pageSubtitle: next.servicesPageSubtitle ?? DEFAULT_SUBTITLE,
        heroVideoUrl: next.servicesHeroVideo,
        heroImageUrl: next.servicesHeroImage,
        services: next.extendedServices ?? [],
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [live]);

  const { pageTitle, pageSubtitle, heroVideoUrl, heroImageUrl, services } =
    view;
  const hasHero = !!(heroVideoUrl ?? heroImageUrl);

  return (
    <>
      {hasHero ? (
        <PageHeroBanner
          eyebrow="Servicios"
          title={pageTitle}
          subtitle={pageSubtitle}
          backgroundType={heroVideoUrl ? "video" : "image"}
          backgroundVideo={heroVideoUrl}
          backgroundImage={heroImageUrl}
          size={pageHeroSize}
          vesta={{
            titulo: "servicios.pagina-titulo",
            subtitulo: "servicios.pagina-subtitulo",
            fondo: heroVideoUrl ? "servicios.pagina-video" : "servicios.pagina-imagen",
          }}
        />
      ) : (
        <div className="container mx-auto px-4 pt-28 sm:pt-32">
          <header className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            {!minimal && (
              <span className="mb-5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                Servicios
              </span>
            )}
            <h1
              className="mb-6 text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl"
              data-vesta="servicios.pagina-titulo"
            >
              {pageTitle}
            </h1>
            {!minimal && (
              <p
                className="text-base leading-relaxed text-muted-foreground sm:text-lg"
                data-vesta="servicios.pagina-subtitulo"
              >
                {pageSubtitle}
              </p>
            )}
          </header>
        </div>
      )}

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          {services.length > 0 && servicesStyle === "icons" ? (
            <ServicesIconList services={services} clave="servicio.ampliado" />
          ) : services.length > 0 ? (
            <ExtendedServicesGrid
              services={services.map((s) => ({
                ...s,
                bullets: s.bullets ? Array.from(s.bullets) : undefined,
              }))}
              descriptionAlign={descriptionAlign}
              stacked={serviciosLayout === "stacked"}
              v1={tarjetaV1}
            />
          ) : (
            // The real page 404s with no services. Inside the editor that reads
            // as a broken preview, and the agency has usually just emptied the
            // list on the way to rewriting it.
            <p className="text-center text-sm text-muted-foreground">
              Todavía no hay servicios configurados, así que la página
              /servicios no se publica.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
