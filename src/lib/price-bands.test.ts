// Las franjas de precio de la barra de una línea (GO4, Guille 4-nov-2026).
// Sin framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/price-bands.test.ts
import { activePriceBand, priceBandsFrom } from "./price-bands";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const bands = priceBandsFrom([100000, 250000, 500000]);

console.log("priceBandsFrom");
ok(bands.length === 4, "tres cortes dan cuatro franjas");
ok(
  bands.map((b) => b.label).join(" | ") ===
    "Hasta 100.000 € | 100.000 – 250.000 € | 250.000 – 500.000 € | Más de 500.000 €",
  "las etiquetas que pidió Guille",
);
ok(bands[0]!.minPrice === undefined && bands[0]!.maxPrice === 100000, "la primera no tiene suelo");
ok(bands[1]!.minPrice === 100001, "un piso de 100.000 € cae solo en la primera");
ok(bands[3]!.minPrice === 500001 && bands[3]!.maxPrice === undefined, "la última no tiene techo");
ok(
  priceBandsFrom([500000, 100000, 250000, 100000]).map((b) => b.key).join() ===
    bands.map((b) => b.key).join(),
  "el orden y los repetidos de la configuración no cambian nada",
);
ok(priceBandsFrom([]).length === 0, "sin cortes, sin barra");

console.log("activePriceBand");
ok(activePriceBand(bands, 100001, 250000)?.key === bands[1]!.key, "la URL de una franja la marca");
ok(activePriceBand(bands, undefined, undefined) === undefined, "sin precio, ninguna");
ok(activePriceBand(bands, 90000, 300000) === undefined, "un precio a mano no se hace pasar por franja");

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\nprice-bands: todo bien");
