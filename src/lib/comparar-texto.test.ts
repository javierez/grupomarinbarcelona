// La comparación de texto de la vista previa con la web (Muñoz Espasande,
// 17-nov-2026). Sin framework: afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/comparar-texto.test.ts
import { diferenciasDeTexto } from "./comparar-texto";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const web = "Queremos que te sientas acompañado\nInmobiliaria en Gijón\nEXPLORAR PROPIEDADES\nGIJÓN, CENTRO DE GIJÓN";

console.log("diferenciasDeTexto");
ok(diferenciasDeTexto(web, web).length === 0, "la misma página no tiene diferencias");
ok(
  diferenciasDeTexto("  Queremos  que te sientas acompañado \n\n\nInmobiliaria en Gijón\nEXPLORAR PROPIEDADES\nGIJÓN, CENTRO DE GIJÓN", web).length === 0,
  "espacios y líneas vacías no cuentan",
);
const previaDeSergio = "Queremos que te sientas acompañado\nGIJÓN, ASTURIAS";
const dif = diferenciasDeTexto(previaDeSergio, web);
ok(dif.includes("+ Inmobiliaria en Gijón"), "falta el subtítulo de la portada editorial");
ok(dif.includes("+ EXPLORAR PROPIEDADES"), "faltan los botones");
ok(dif.includes("- GIJÓN, ASTURIAS") && dif.includes("+ GIJÓN, CENTRO DE GIJÓN"), "la ubicación de la tarjeta, de las dos");
ok(diferenciasDeTexto("Propiedades", "PROPIEDADES").length === 2, "las mayúsculas cuentan: se ven");

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\nTodo bien.");
