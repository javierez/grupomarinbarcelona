// Shared price helpers for promotion cards / panels. Mirrors `formatPrice` in
// `~/lib/utils` but returns null for empty/non-positive values so callers can
// hide the price line entirely instead of rendering "0 €".
export function formatPromotionPrice(value: string | null): string | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(n);
}

export function buildPromotionPriceLabel(
  min: string | null,
  max: string | null,
): string | null {
  const minF = formatPromotionPrice(min);
  const maxF = formatPromotionPrice(max);
  if (minF && maxF && minF !== maxF) return `${minF} € — ${maxF} €`;
  if (minF) return `Desde ${minF} €`;
  if (maxF) return `Hasta ${maxF} €`;
  return null;
}
