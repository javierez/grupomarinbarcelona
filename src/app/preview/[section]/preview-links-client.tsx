"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { LinkCategory } from "~/server/queries/website-config";

export function PreviewLinksClient({
  initialCategories,
}: {
  initialCategories: LinkCategory[];
}) {
  const [categories, setCategories] =
    useState<LinkCategory[]>(initialCategories);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: LinkCategory[];
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "links"
      )
        return;
      if (Array.isArray(data.patch)) setCategories(data.patch);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        Enlaces de Interés
      </h1>
      <p className="mb-8 text-muted-foreground">
        Directorio de enlaces útiles.
      </p>
      {categories.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No hay enlaces configurados.
        </p>
      ) : (
        <div className="space-y-10">
          {categories.map((cat, i) => (
            <div key={i}>
              <h2 className="mb-4 text-xl font-bold">
                {cat.name || "Sin nombre"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(cat.links ?? []).map((link, j) => (
                  <span
                    key={j}
                    className="group flex items-center gap-2 rounded-lg border border-border/40 px-4 py-3 text-sm font-medium"
                  >
                    {link.title || "Sin título"}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
