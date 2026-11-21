"use client";

import { useEffect, useState } from "react";
import { Destacados } from "~/components/propertygrid/destacados";
import type { ResolvedVideoFeatures } from "~/lib/video-features";
import type { ListingCardData } from "~/server/queries/listings";
import type {
  FeaturesProps,
  PropertiesConfig,
} from "~/server/queries/website-config";
import { announceReady } from "./preview-patch";

/** Lo que el editor cambia en directo: los textos. */
type TextosDestacados = Partial<
  Pick<PropertiesConfig, "title" | "subtitle" | "buttonText">
>;

/**
 * «Propiedades destacadas» en directo: los textos (título, subtítulo, botón)
 * siguen al editor; las fichas son las guardadas en la base. Pinta
 * `Destacados`, lo mismo que la web.
 */
export function PreviewPropertiesClient({
  initialConfig,
  ...datos
}: {
  initialConfig: PropertiesConfig;
  listings: ListingCardData[];
  watermarkEnabled: boolean;
  features: FeaturesProps;
  video: ResolvedVideoFeatures;
  tight: boolean;
}) {
  const [cfg, setCfg] = useState<PropertiesConfig>(initialConfig);

  useEffect(() => {
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: TextosDestacados;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "properties"
      )
        return;
      setCfg((prev) => ({ ...prev, ...(data.patch ?? {}) }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <Destacados config={cfg} {...datos} />;
}
