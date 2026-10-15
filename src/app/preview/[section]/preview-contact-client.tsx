"use client";

import { useEffect, useState } from "react";
import { ContactContent } from "~/components/contact/ContactContent";
import type { ContactProps } from "~/server/queries/contact";

const FALLBACK: ContactProps = {
  title: "Contáctanos",
  subtitle:
    "¿Tienes preguntas o estás listo para dar el siguiente paso? Nuestro equipo está aquí para ayudarte.",
  messageForm: true,
  address: true,
  phone: true,
  mail: true,
  schedule: true,
  map: true,
  offices: [],
};

export function PreviewContactClient({
  initialProps,
}: {
  initialProps: ContactProps | null;
}) {
  const [props, setProps] = useState<ContactProps>(initialProps ?? FALLBACK);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: Partial<ContactProps>;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "contact"
      )
        return;
      setProps((prev) => ({ ...prev, ...(data.patch ?? {}) }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <ContactContent
      title={props.title ?? "Contáctanos"}
      subtitle={props.subtitle ?? ""}
      messageForm={props.messageForm ?? true}
      address={props.address ?? true}
      phone={props.phone ?? true}
      mail={props.mail ?? true}
      schedule={props.schedule ?? true}
      map={props.map ?? true}
      contactProps={props}
    />
  );
}
