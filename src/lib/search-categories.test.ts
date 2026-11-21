// Categorías del listado (Oportunidad, Origen bancario, Destacados) y el nombre
// viejo «a-estrenar» en la URL. Sin framework: afirma, imprime un resumen y
// sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/search-categories.test.ts
import { buildSearchSlug, parseSearchSlug } from "./search-utils";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

console.log("parseSearchSlug: la categoría en el sitio de la ciudad");
eq(parseSearchSlug("venta-propiedades/origen-bancario").isBankOwned, true, "origen-bancario filtra por banco");
eq(parseSearchSlug("venta-propiedades/origen-bancario").cities, undefined, "origen-bancario no es una ciudad");
eq(parseSearchSlug("venta-propiedades/destacados").isFeatured, true, "destacados filtra por destacados");
eq(parseSearchSlug("venta-propiedades/oportunidad").isOportunidad, true, "oportunidad sigue igual");

console.log("parseSearchSlug: la categoría junto a los filtros");
const refinada = parseSearchSlug("venta-pisos/en-leon/con-origen-bancario,destacados");
eq(refinada.isBankOwned, true, "con ciudad, origen bancario viaja en con-");
eq(refinada.isFeatured, true, "con ciudad, destacados viaja en con-");
eq(refinada.cities?.[0], "leon", "y la ciudad se queda");

console.log("buildSearchSlug: ida y vuelta");
const slug = buildSearchSlug({ status: "for-sale", cities: ["León"], isBankOwned: true, isFeatured: true });
eq(slug.includes("origen-bancario"), true, "origen bancario sale en la URL al refinar");
eq(slug.includes("destacados"), true, "destacados sale en la URL al refinar");
eq(parseSearchSlug(slug).isBankOwned, true, "y vuelve al leerla");

console.log("a-estrenar, el nombre de antes de obra-nueva");
eq(parseSearchSlug("venta-pisos/todas-ubicaciones/con-a-estrenar").amenities?.[0], "obra-nueva", "a-estrenar filtra como obra-nueva");
eq(
  buildSearchSlug({ status: "for-sale", amenities: parseSearchSlug("venta-pisos/todas-ubicaciones/con-a-estrenar").amenities }).includes("a-estrenar"),
  false,
  "al refinar sale el nombre nuevo",
);

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
