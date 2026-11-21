// Precios y metros con el punto de miles también en 4 cifras. La ficha usaba
// toLocaleString("es-ES"), que en es-ES no agrupa hasta 10.000: «1200€/mes».
// Sin framework: afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/price-format.test.ts
import { formatNumber, formatPrice, formatPriceOrConsult } from "./utils";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

console.log("formatPrice / formatNumber");
eq(formatPrice(1200), "1.200", "4 cifras con punto");
eq(formatPrice("1200"), "1.200", "también desde texto");
eq(formatPrice(950), "950", "3 cifras sin punto");
eq(formatPrice(245000), "245.000", "6 cifras");
eq(formatPrice(1200.6), "1.201", "sin decimales");
eq(formatPriceOrConsult(1200, true), "1.200€/mes", "alquiler de 4 cifras");
eq(formatPriceOrConsult(0), "A consultar", "sin precio");
eq(formatNumber(1200), "1.200", "metros de una nave");

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
