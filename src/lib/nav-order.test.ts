// El orden de la barra: lo que no aparece en `navOrder` se queda donde estaba,
// salvo un enlace añadido por la agencia, que va al final. Sin framework:
// afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/nav-order.test.ts
import { applyNavOrder, type NavItemKey } from "./nav-order";

let failed = 0;

function ok(actual: string[], expected: string[], what: string): void {
  if (actual.join(",") === expected.join(",")) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.log(`  ✗ ${what}: esperado ${expected.join(",")}, recibido ${actual.join(",")}`);
}

const orden = (keys: NavItemKey[], navOrder?: string[]) =>
  applyNavOrder(keys.map((key) => ({ key })), navOrder).map((i) => i.key);

console.log("\napplyNavOrder");
ok(orden(["venta", "alquiler", "contacto"]), ["venta", "alquiler", "contacto"], "sin orden, el de la plantilla");
ok(
  orden(["venta", "alquiler", "contacto"], ["contacto", "venta", "alquiler"]),
  ["contacto", "venta", "alquiler"],
  "con orden, el guardado",
);
ok(
  orden(["reformas", "venta", "alquiler"], ["alquiler", "venta"]),
  ["reformas", "alquiler", "venta"],
  "Reformas (141), sin nombrar, sigue delante",
);
ok(
  orden(["venta", "contacto", "extra:/reformas-integrales"], ["contacto", "venta"]),
  ["contacto", "venta", "extra:/reformas-integrales"],
  "un enlace añadido sin colocar va al final",
);
ok(
  orden(["venta", "contacto", "extra:/a", "extra:/b"], ["extra:/b", "venta", "contacto"]),
  ["extra:/b", "venta", "contacto", "extra:/a"],
  "uno colocado va a su sitio y el otro al final",
);
ok(
  orden(["venta", "extra:/a"], ["inexistente", "venta"]),
  ["venta", "extra:/a"],
  "una clave que la plantilla no pinta no estorba",
);

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
