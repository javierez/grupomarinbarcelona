"use client";

import { useEffect, useState, type ReactNode } from "react";

interface PropertiesConfig {
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

// Live-editable wrapper around a server-rendered PropertyGrid: text fields
// (title/subtitle/buttonText) update via postMessage, but the actual listing
// rows stay as the saved DB data — they're rendered server-side and passed in
// as `gridSlot`. Editing rows live would require live data fetches.
export function PreviewPropertiesClient({
  initialConfig,
  gridSlot,
}: {
  initialConfig: PropertiesConfig;
  gridSlot: ReactNode;
}) {
  const [cfg, setCfg] = useState<PropertiesConfig>(initialConfig);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: PropertiesConfig;
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

  return (
    <section className="pb-12 pt-12 sm:pb-16">
      <div className="container">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            {cfg.title || "Propiedades Destacadas"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {cfg.subtitle ||
              "Descubre nuestra selección de propiedades disponibles"}
          </p>
        </div>
        {gridSlot}
        <div className="mt-8 flex justify-center">
          <span className="rounded-md border px-6 py-2 text-sm font-medium">
            {cfg.buttonText || "Ver Todas las Propiedades"}
          </span>
        </div>
      </div>
    </section>
  );
}
