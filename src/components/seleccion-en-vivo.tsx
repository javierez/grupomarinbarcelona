"use client";

import { useEffect } from "react";
import { ordenDeSeleccion } from "~/lib/seleccion";
import type * as Pantalla from "~/lib/seleccion-en-pantalla";
import { esPadrePermitido } from "~/lib/vesta-origins";

/**
 * Escucha el «Señalar» de «Mi web» (contrato web-por-chat §6.1). Solo se pinta
 * en la vista previa y en el borrador, y el marco con su etiqueta no se baja
 * hasta que el CRM lo enciende.
 */
export function SeleccionEnVivo() {
  useEffect(() => {
    if (window.parent === window) return;
    let pantalla: Promise<typeof Pantalla> | null = null;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent || !esPadrePermitido(e.origin, window.location.origin)) return;
      const activo = ordenDeSeleccion(e.data);
      if (activo === null || (!activo && !pantalla)) return;
      pantalla ??= import("~/lib/seleccion-en-pantalla");
      void pantalla.then((m) => (activo ? m.activarSeleccion(e.origin) : m.desactivarSeleccion()));
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      void pantalla?.then((m) => m.desactivarSeleccion());
    };
  }, []);

  return null;
}
