// Franjas de precio fijas para la barra de una sola línea de los resultados
// (`features_props.priceBands`). La agencia da los cortes; la web los convierte
// en franjas que no se pisan: cada una empieza 1 € por encima de la anterior.
// Con `desde_100000`, la finca de 100.000 € de GO4 (GO4A029) salía en dos.

export interface PriceBand {
  /** Value of the Select option. Stable, URL-free. */
  key: string;
  label: string;
  minPrice?: number;
  maxPrice?: number;
}

// Points by hand: es-ES leaves 4-digit amounts ungrouped («5000»), and the
// site's TypeScript lib doesn't know `useGrouping: "always"`.
const formatEuros = (n: number) =>
  `${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} €`;

/** [100000, 250000, 500000] → Hasta 100.000 €, 100.000 – 250.000 €, …, Más de 500.000 €. */
export function priceBandsFrom(limits: number[]): PriceBand[] {
  const cuts = Array.from(new Set(limits.filter((n) => n > 0))).sort(
    (a, b) => a - b,
  );
  if (cuts.length === 0) return [];

  const bands: PriceBand[] = [
    { key: `0-${cuts[0]}`, label: `Hasta ${formatEuros(cuts[0]!)}`, maxPrice: cuts[0] },
  ];
  for (let i = 1; i < cuts.length; i++) {
    const from = cuts[i - 1]!;
    const to = cuts[i]!;
    bands.push({
      key: `${from}-${to}`,
      label: `${formatEuros(from).replace(" €", "")} – ${formatEuros(to)}`,
      minPrice: from + 1,
      maxPrice: to,
    });
  }
  const last = cuts[cuts.length - 1]!;
  bands.push({ key: `${last}-`, label: `Más de ${formatEuros(last)}`, minPrice: last + 1 });
  return bands;
}

/** The band the current URL is on, or undefined (no price, or a hand-typed one). */
export function activePriceBand(
  bands: PriceBand[],
  minPrice?: number,
  maxPrice?: number,
): PriceBand | undefined {
  return bands.find((b) => b.minPrice === minPrice && b.maxPrice === maxPrice);
}
