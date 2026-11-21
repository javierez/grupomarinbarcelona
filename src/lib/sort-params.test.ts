// Cuándo lleva `?sort=` un enlace del listado (desplegable, paginación, feed).
// Sin framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/sort-params.test.ts
import { applySortParam } from "./sort-params";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

function sortOf(sort: string, defaultSort: string): string | null {
  const params = new URLSearchParams();
  applySortParam(params, sort, defaultSort);
  return params.get("sort");
}

console.log("applySortParam");
eq(sortOf("default", "default"), null, "cuenta sin orden propio: Destacados no ensucia la URL");
eq(sortOf("price-asc", "default"), "price-asc", "cuenta sin orden propio: otro orden viaja");
eq(sortOf("newest", "newest"), null, "el orden de la agencia (Ecogar: más recientes) no viaja");
eq(
  sortOf("default", "newest"),
  "default",
  "volver a Destacados en una cuenta con otro orden SÍ viaja (antes no había forma)",
);

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\nTodo bien");
