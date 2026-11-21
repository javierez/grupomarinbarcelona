/**
 * El id del píxel de Meta (Facebook e Instagram) que la agencia pega en
 * Administración → Web → Código. Vale el número suelto o el bloque entero que
 * da Meta (`fbq('init', '141308383173955')`): nos quedamos con el número.
 *
 * Hasta el 7-nov-2026 ninguna web lo leía: Active House y Ecogar lo tenían
 * puesto y Meta no veía ni una visita.
 */
export function parseMetaPixel(raw: string | null | undefined): string | null {
  const text = raw?.trim();
  if (!text) return null;
  const init = /fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/.exec(text);
  if (init) return init[1]!;
  const solo = text.replace(/\s/g, "");
  return /^\d{10,20}$/.test(solo) ? solo : null;
}
