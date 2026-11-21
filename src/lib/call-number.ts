// Número del botón flotante de llamar. Acepta fijo o móvil español (9 cifras
// que empiezan por 6, 7, 8 o 9), con o sin +34, espacios o guiones.
// Devuelve el enlace tel: listo, o null si no hay número válido (sin botón).
export function toTelHref(raw: string | null | undefined): string | null {
  const digits = raw?.replace(/\D/g, "") ?? "";
  const national =
    digits.length === 11 && digits.startsWith("34") ? digits.slice(2) : digits;
  if (national.length !== 9 || !/^[6-9]/.test(national)) return null;
  return `tel:+34${national}`;
}
