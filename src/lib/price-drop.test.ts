// La etiqueta «Ha bajado X €» y la cuota de hipoteca de la ficha. Sin
// framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/price-drop.test.ts
import { monthlyMortgagePayment } from "./mortgage";
import { isRealPriceDrop, latestRealPriceDrop } from "./price-drop";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const now = d("2026-10-07");

console.log("isRealPriceDrop");
ok(isRealPriceDrop(199000, 189000), "199.000 → 189.000 es una bajada");
ok(!isRealPriceDrop(189000, 199000), "una subida no lo es");
ok(!isRealPriceDrop(19900, 199000), "corregir una errata no lo es");
ok(!isRealPriceDrop(199000, 19900), "teclear una errata no lo es");
ok(!isRealPriceDrop(1, 150000), "salir de un precio de relleno no lo es");
ok(!isRealPriceDrop(null, 150000), "un precio vacío no lo es");
ok(!isRealPriceDrop(NaN, 150000), "un precio ilegible no lo es");

console.log("latestRealPriceDrop");
ok(latestRealPriceDrop([], now) === null, "sin cambios, nada");
ok(
  latestRealPriceDrop(
    [{ createdAt: d("2026-09-29"), oldValue: 199000, newValue: 189000 }],
    now,
  )?.amount === 10000,
  "bajada de hace 8 días: 10.000 €",
);
ok(
  latestRealPriceDrop(
    [{ createdAt: d("2026-08-20"), oldValue: 199000, newValue: 189000 }],
    now,
  ) === null,
  "una bajada de hace más de 30 días ya no se enseña",
);
ok(
  latestRealPriceDrop(
    [
      { createdAt: d("2026-09-20"), oldValue: 199000, newValue: 189000 },
      { createdAt: d("2026-09-28"), oldValue: 189000, newValue: 195000 },
    ],
    now,
  ) === null,
  "si después volvió a subir, no hay etiqueta",
);
ok(
  latestRealPriceDrop(
    [
      { createdAt: d("2026-10-01"), oldValue: 199000, newValue: 19900 },
      { createdAt: d("2026-10-02"), oldValue: 19900, newValue: 199000 },
    ],
    now,
  ) === null,
  "errata y corrección no enseñan «Ha bajado 179.100 €»",
);

console.log("monthlyMortgagePayment");
ok(
  Math.round(monthlyMortgagePayment(151200, 3.1, 30)) === 646,
  "151.200 € a 30 años al 3,10 % son 646 €/mes",
);
ok(monthlyMortgagePayment(120000, 0, 10) === 1000, "al 0 % es el capital entre los meses");
ok(monthlyMortgagePayment(0, 3, 30) === 0, "sin hipoteca, cuota 0");
ok(monthlyMortgagePayment(100000, 3, 0) === 0, "sin plazo, cuota 0");

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
