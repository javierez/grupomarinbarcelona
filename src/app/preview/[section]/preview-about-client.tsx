"use client";

import { useEffect, useState } from "react";
import { AboutHeader } from "~/components/about/AboutHeader";
import { ServicesGrid } from "~/components/about/ServicesGrid";
import { MissionSection } from "~/components/about/MissionSection";
import { AboutButton } from "~/components/about/AboutButton";
import { KpiSection } from "~/components/about/KpiSection";
import type { AboutProps } from "~/lib/data";

const FALLBACK: AboutProps = {
  title: "Sobre Nosotros",
  subtitle: "Tu socio de confianza en el viaje inmobiliario",
  content:
    "Creemos que encontrar la propiedad perfecta debe ser una experiencia emocionante y gratificante.",
  content2:
    "Ya sea que estés comprando, vendiendo o invirtiendo, tenemos el conocimiento para ayudarte.",
  image: "",
  services: [
    { title: "Conocimiento local experto", icon: "map" },
    { title: "Servicio personalizado", icon: "user" },
    { title: "Comunicación transparente", icon: "message-square" },
    { title: "Experiencia en negociación", icon: "handshake" },
    { title: "Marketing integral", icon: "megaphone" },
    { title: "Soporte continuo", icon: "help-circle" },
  ],
  servicesSectionTitle: "Nuestros Servicios",
  aboutSectionTitle: "Nuestra Misión",
  buttonName: "Contacta a Nuestro Equipo",
  maxServicesDisplayed: 6,
  showKPI: false,
};

export function PreviewAboutClient({
  initialProps,
}: {
  initialProps: AboutProps | null;
}) {
  const [props, setProps] = useState<AboutProps>(initialProps ?? FALLBACK);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: Partial<AboutProps>;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "about"
      )
        return;
      setProps((prev) => ({ ...prev, ...(data.patch ?? {}) }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const kpis: { name: string; data: string }[] = [];
  if (props.kpi1Name && props.kpi1Data)
    kpis.push({ name: props.kpi1Name, data: props.kpi1Data });
  if (props.kpi2Name && props.kpi2Data)
    kpis.push({ name: props.kpi2Name, data: props.kpi2Data });
  if (props.kpi3Name && props.kpi3Data)
    kpis.push({ name: props.kpi3Name, data: props.kpi3Data });
  if (props.kpi4Name && props.kpi4Data)
    kpis.push({ name: props.kpi4Name, data: props.kpi4Data });

  return (
    <section
      className="pb-12 pl-6 pr-4 pt-12 sm:pb-16 sm:pl-10 lg:pb-24 lg:pl-16"
      id="about"
    >
      <div className="container">
        <AboutHeader
          title={props.title ?? ""}
          subtitle={props.subtitle ?? ""}
        />
        <div className="grid items-start gap-8 sm:gap-12 lg:grid-cols-2">
          <ServicesGrid
            services={props.services ?? []}
            title={props.servicesSectionTitle ?? "Nuestros Servicios"}
            maxServicesDisplayed={props.maxServicesDisplayed ?? 6}
          />
          {/* v2's MissionSection renders a single body, unlike v1's two
              paragraphs — join them so nothing the agency typed is lost. */}
          <MissionSection
            title={props.aboutSectionTitle ?? "Nuestra Misión"}
            content={[props.content, props.content2]
              .filter(Boolean)
              .join("\n\n")}
          />
        </div>
        <AboutButton
          text={props.buttonName ?? "Contacta a Nuestro Equipo"}
          href="#contact"
        />
        {props.showKPI && <KpiSection kpis={kpis} />}
      </div>
    </section>
  );
}
