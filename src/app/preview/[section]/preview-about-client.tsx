"use client";

import { useEffect, useState } from "react";
import { SobreNosotros } from "~/components/about/sobre-nosotros";
import type { AboutProps } from "~/lib/data";
import type { FeaturesProps } from "~/server/queries/website-config";
import { announceReady } from "./preview-patch";

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
  features,
  accountId,
}: {
  initialProps: AboutProps | null;
  features: FeaturesProps;
  accountId: string;
}) {
  const [props, setProps] = useState<AboutProps>(initialProps ?? FALLBACK);

  useEffect(() => {
    announceReady();
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

  // El mismo bloque que la web (`about-section.tsx`).
  return (
    <SobreNosotros
      about={props}
      features={features}
      tight={accountId === "139"}
      videoConocenos={accountId === "129"}
    />
  );
}
