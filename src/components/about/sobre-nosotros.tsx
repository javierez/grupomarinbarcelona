"use client";

import Image from "next/image";
import type { AboutProps } from "~/lib/data";
import type { FeaturesProps } from "~/server/queries/website-config";
import { ACCOUNT_139_SECTION_PADDING } from "~/lib/account-overrides/139";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { AboutV3 } from "../v3/about-v3";
import { YouTubeEmbed } from "../ui/youtube-embed";
import { AboutButton } from "./AboutButton";
import { AboutHeader } from "./AboutHeader";
import { KpiSection } from "./KpiSection";
import { MissionSection } from "./MissionSection";
import { RichAboutText } from "./RichAboutText";
import { ServicesGrid } from "./ServicesGrid";
import { ServicesIconList } from "./ServicesIconList";

/**
 * «Sobre nosotros» de la portada. La pintan la web (`about-section.tsx`) y la
 * vista previa del CRM (`preview-about-client.tsx`): la vista previa tenía su
 * propia copia sin la foto, sin la v3 y sin el segundo texto, y Muñoz
 * Espasande veía en el editor otro bloque que en su web (17-nov-2026).
 */
export function SobreNosotros({
  about,
  features,
  tight = false,
  videoConocenos = false,
}: {
  about: AboutProps | null;
  features: FeaturesProps;
  /** Los márgenes cortos de la 139. */
  tight?: boolean;
  /** El vídeo «Conócenos» de la 129 en lugar de los servicios. */
  videoConocenos?: boolean;
}) {
  if (features.aboutStyle === "v3") {
    return (
      <AboutV3
        about={about}
        moreHref={features.pages?.nosotros ? "/nosotros" : "/#contact"}
      />
    );
  }
  const descriptionAlign = features.descriptionAlign;
  // v1 look: its padding, and the second text under the mission (no box).
  const v1 = features.aspectoV1 === true;
  // Opt-in photo beside the text; the services grid then sits under the copy.
  const aboutImage =
    features.sections?.aboutImage === true && about?.image ? about.image : null;

  // Fallbacks in case data is missing
  const title = about?.title || "Sobre Nosotros";
  const subtitle =
    about?.subtitle || "Tu socio de confianza en el viaje inmobiliario";
  const content =
    about?.content ||
    "Creemos que encontrar la propiedad perfecta debe ser una experiencia emocionante y gratificante. Con años de experiencia en la industria, nuestro dedicado equipo de profesionales está comprometido a proporcionar un servicio y orientación excepcionales a lo largo de tu viaje inmobiliario.";
  // Optional full-width block rendered below the about grid (empty = hidden).
  const content2 = about?.content2 ?? "";
  const services = about?.services || [
    { title: "Conocimiento local experto", icon: "map" },
    { title: "Servicio personalizado", icon: "user" },
    { title: "Comunicación transparente", icon: "message-square" },
    { title: "Experiencia en negociación", icon: "handshake" },
    { title: "Marketing integral", icon: "megaphone" },
    { title: "Soporte continuo", icon: "help-circle" },
  ];

  const kpis = (
    [
      [about?.kpi1Name, about?.kpi1Data],
      [about?.kpi2Name, about?.kpi2Data],
      [about?.kpi3Name, about?.kpi3Data],
      [about?.kpi4Name, about?.kpi4Data],
    ] as const
  ).flatMap(([name, data]) => (name && data ? [{ name, data }] : []));

  // "icons": the services leave the side column and run full width under the
  // mission as an even two-column list. The /servicios entries are preferred
  // because they carry a description; the short home list is the fallback.
  const iconServices =
    features.servicesStyle === "icons"
      ? about?.extendedServices?.length
        ? about.extendedServices
        : services
      : null;
  const servicesGrid = (
    <ServicesGrid
      services={services}
      title={about?.servicesSectionTitle || "Nuestros Servicios"}
      maxServicesDisplayed={about?.maxServicesDisplayed || 6}
    />
  );

  return (
    <section
      className={tight ? ACCOUNT_139_SECTION_PADDING : v1 ? "pb-12 pt-24 sm:pb-16 lg:pb-24" : "py-24 sm:py-28 lg:py-32"}
      id="about"
      data-vesta="nosotros"
    >
      <div className="container">
        <AboutHeader title={title} subtitle={subtitle} />

        <div className="grid items-start gap-8 sm:gap-12 lg:grid-cols-2">
          {videoConocenos ? (
            <YouTubeEmbed videoId="-Q34xHrPcB4" title="Conócenos" />
          ) : aboutImage ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl" data-vesta="nosotros.imagen">
              <Image
                src={aboutImage}
                alt={title}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : iconServices ? null : (
            servicesGrid
          )}

          <div
            className={cn(
              "space-y-10",
              iconServices && !aboutImage && "lg:col-span-2 mx-auto max-w-3xl",
            )}
          >
            <MissionSection
              title={about?.aboutSectionTitle || "Nuestra Misión"}
              content={content}
              content2={v1 ? content2 : undefined}
            />
            {aboutImage && !iconServices && servicesGrid}
          </div>
        </div>

        {iconServices && (
          <div className="mt-16 sm:mt-20">
            <h3 className="mb-10 text-center text-xs font-medium uppercase tracking-eyebrow text-muted-foreground sm:mb-12">
              {about?.servicesSectionTitle || "Nuestros Servicios"}
            </h3>
            <ServicesIconList
              clave={about?.extendedServices?.length ? "servicio.ampliado" : "servicio"}
              services={iconServices.slice(0, about?.maxServicesDisplayed || 6)}
            />
          </div>
        )}

        {content2 && !v1 && (
          <Card
            className={cn("border-border/60", tight ? "mt-6 sm:mt-8" : "mt-10 sm:mt-14")}
            data-vesta="nosotros.texto2"
          >
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <RichAboutText text={content2} align={descriptionAlign} />
            </CardContent>
          </Card>
        )}

        <AboutButton
          text={about?.buttonName || "Contacta a Nuestro Equipo"}
          href="#contact"
        />

        {about?.showKPI && <KpiSection kpis={kpis} />}
      </div>
    </section>
  );
}
