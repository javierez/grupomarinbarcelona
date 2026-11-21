"use client";

import { useEffect, useState } from "react";
import { Contacto } from "~/components/contact/contacto";
import type { SocialLink } from "~/components/ui/social-links";
import type { FeaturesProps } from "~/server/queries/website-config";
import type { ContactProps } from "~/server/queries/contact";
import { announceReady } from "./preview-patch";

export function PreviewContactClient({
  initialProps,
  ...datos
}: {
  initialProps: ContactProps | null;
  socialLinks: SocialLink[];
  features: FeaturesProps;
  brandColor?: string | null;
}) {
  const [props, setProps] = useState<ContactProps | null>(initialProps);

  useEffect(() => {
    announceReady();
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
      setProps((prev) => ({ ...prev, ...(data.patch ?? {}) }) as ContactProps);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Lo mismo que la web (`ContactSection`).
  return <Contacto contactProps={props} {...datos} />;
}
