import { telefonoParaLaFicha } from "./identidad-de-contacto";
import { webFormTermsAccepted } from "./web-form-consent";

/**
 * Lo que cambia en un contacto que ya estaba cuando vuelve a escribir desde la
 * web para vender (/vender, el corto y el completo, y el bloque «formulario»
 * de una página propia). Lo suyo no se pisa: se completa el correo que
 * faltaba, el teléfono va donde lo pondría el CRM (`telefonoParaLaFicha`),
 * entra en Captaciones si no estaba en ninguna fase y la nota se añade a las
 * suyas con la fecha, como hace el formulario de contacto.
 */
export type ContactoQueYaEstaba = {
  email: string | null;
  phone: string | null;
  secondaryPhone: string | null;
  source: string | null;
  captacionStatus: string | null;
  additionalInfo: unknown;
};

export type DatosDelPropietario = {
  email: string | null;
  phone: string | null;
  nota: string;
  terminosAceptados: boolean;
};

export function cambiosDelPropietario(
  ya: ContactoQueYaEstaba,
  d: DatosDelPropietario,
  ahora: Date,
) {
  const info =
    ya.additionalInfo && typeof ya.additionalInfo === "object" && !Array.isArray(ya.additionalInfo)
      ? (ya.additionalInfo as Record<string, unknown>)
      : {};
  const notas = typeof info.notes === "string" ? info.notes : "";
  const nota = `[${ahora.toLocaleDateString("es-ES")}] ${d.nota}`;
  return {
    updatedAt: ahora,
    ...(d.email && !ya.email ? { email: d.email } : {}),
    ...telefonoParaLaFicha(ya, d.phone),
    ...(ya.source ? {} : { source: "Website" }),
    ...(ya.captacionStatus
      ? {}
      : { captacionStatus: "pendiente", captacionStatusUpdatedAt: ahora }),
    additionalInfo: {
      ...info,
      notes: notas ? `${notas}\n${nota}` : nota,
      lastWebContact: ahora.toISOString(),
      ...(d.terminosAceptados ? webFormTermsAccepted(ahora) : {}),
    },
  };
}
