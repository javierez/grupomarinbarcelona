/**
 * Cuota mensual de una hipoteca a tipo fijo (sistema francés). Cálculo
 * orientativo para la ficha: sin impuestos ni gastos, que cambian por
 * comunidad y por comprador.
 */
export function monthlyMortgagePayment(
  principal: number,
  annualRatePct: number,
  years: number,
): number {
  const n = Math.round(years * 12);
  if (!(principal > 0) || !(n > 0)) return 0;
  const r = annualRatePct / 100 / 12;
  if (!(r > 0)) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}
