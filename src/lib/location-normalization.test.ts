// Nombres de municipio en las páginas /venta-…/en-…. Sin framework: afirma,
// imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/location-normalization.test.ts
import { formatPlaceName } from "./location-normalization";

const cases: [string, string][] = [
  ["Caldes D'estrac", "Caldes d'Estrac"],
  ["L'hospitalet de Llobregat", "L'Hospitalet de Llobregat"],
  ["L'esquirol", "L'Esquirol"],
  ["Sant Sadurní D'anoia", "Sant Sadurní d'Anoia"],
  ["Mataró", "Mataró"],
  ["El Mas Móra", "El Mas Móra"],
];

let failed = 0;
for (const [input, expected] of cases) {
  const got = formatPlaceName(input);
  if (got !== expected) {
    failed++;
    console.error(`✗ ${input} → ${got} (esperado ${expected})`);
  }
}
console.log(`${cases.length - failed}/${cases.length} ok`);
process.exit(failed ? 1 : 0);
