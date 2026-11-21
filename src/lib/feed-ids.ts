/**
 * Tope de inmuebles por petición del feed. El feed pide de tres en tres
 * (`PropertyFeed`), así que 24 sobra; sin tope, una sola llamada pedía las
 * fotos de miles.
 */
export const FEED_IDS_MAX = 24;

/**
 * Los ids de inmueble que manda el navegador al feed, ya limpios: solo
 * enteros positivos en texto, sin repetir y como mucho `FEED_IDS_MAX`. Lo que
 * no es un id se descarta en vez de reventar en `BigInt()`.
 */
export function feedIds(raw: unknown): bigint[] {
  if (!Array.isArray(raw)) return [];
  const ids = new Set<string>();
  for (const value of raw) {
    if (ids.size >= FEED_IDS_MAX) break;
    if (typeof value !== "string" || !/^[1-9]\d{0,18}$/.test(value)) continue;
    ids.add(value);
  }
  return [...ids].map((id) => BigInt(id));
}
