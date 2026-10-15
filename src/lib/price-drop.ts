/**
 * La última bajada de precio REAL de un inmueble, para la etiqueta «Ha bajado
 * X €» de la ficha.
 *
 * Copia de la regla del CRM (`src/lib/properties/price-drop.ts` y
 * `price-outlier.ts` en el repo `vesta`): los dos leen la misma tabla
 * `listing_activity` y tienen que decidir lo mismo. Si cambia allí, cambia aquí.
 *
 * «Real» descarta una corrección de un precio de relleno (0 € o 1 €), un salto
 * de errata (19.900 por 199.000 y vuelta) y una bajada a la que después siguió
 * una subida.
 */

/** Cuánto tiempo sigue siendo noticia una bajada. */
export const PRICE_DROP_MAX_AGE_DAYS = 30;
/** Dos precios a más de esta proporción son una errata, no una bajada. */
const PRICE_OUTLIER_RATIO = 5;
/** Por debajo de esto no es un precio, es un relleno. */
const PLACEHOLDER_PRICE_MAX = 1;

export interface PriceChangeEvent {
  createdAt: Date;
  oldValue: number | null | undefined;
  newValue: number | null | undefined;
}

export interface PriceDrop {
  amount: number;
  oldPrice: number;
  newPrice: number;
  date: Date;
}

export function isRealPriceDrop(
  oldPrice: number | null | undefined,
  newPrice: number | null | undefined,
): boolean {
  if (oldPrice == null || newPrice == null) return false;
  if (!(oldPrice > PLACEHOLDER_PRICE_MAX) || !(newPrice > PLACEHOLDER_PRICE_MAX)) return false;
  if (newPrice >= oldPrice) return false;
  return oldPrice / newPrice < PRICE_OUTLIER_RATIO;
}

/** Solo cuenta el ÚLTIMO cambio de precio, y solo si es de hace 30 días o menos. */
export function latestRealPriceDrop(
  events: PriceChangeEvent[],
  now: Date = new Date(),
): PriceDrop | null {
  if (events.length === 0) return null;
  const last = events.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));

  const ageDays = (now.getTime() - last.createdAt.getTime()) / 86_400_000;
  if (ageDays > PRICE_DROP_MAX_AGE_DAYS) return null;

  const oldPrice = Number(last.oldValue);
  const newPrice = Number(last.newValue);
  if (!isRealPriceDrop(oldPrice, newPrice)) return null;

  return { amount: oldPrice - newPrice, oldPrice, newPrice, date: last.createdAt };
}
