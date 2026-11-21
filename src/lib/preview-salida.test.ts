// Una navegación que sale de la vista previa del editor vuelve a ella.
// Sin framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/preview-salida.test.ts
import { vueltaALaPrevia } from "./preview-salida";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

const O = "https://vestawebpage-v2.vercel.app";
const PREVIA = `${O}/preview/home?accountId=180&token=abc&exp=1`;

console.log("vueltaALaPrevia");
eq(
  vueltaALaPrevia({ url: `${O}/venta-pisos/todas-ubicaciones`, referer: PREVIA, destino: "iframe", esRsc: false }),
  PREVIA,
  "clic en un enlace dentro del marco: vuelve a la vista previa",
);
eq(
  vueltaALaPrevia({ url: `${O}/venta-pisos/todas-ubicaciones?_rsc=x`, referer: PREVIA, destino: "empty", esRsc: true }),
  PREVIA,
  "navegación de Next (Link, buscador): vuelve",
);
eq(
  vueltaALaPrevia({ url: `${O}/preview/servicios?accountId=180`, referer: PREVIA, destino: "iframe", esRsc: false }),
  null,
  "de una página de la vista previa a otra: sigue",
);
eq(
  vueltaALaPrevia({ url: `${O}/venta-pisos/todas-ubicaciones`, referer: null, destino: "document", esRsc: false }),
  null,
  "la web normal, sin venir de la vista previa: sigue",
);
eq(
  vueltaALaPrevia({ url: `${O}/venta-pisos/todas-ubicaciones`, referer: `${O}/`, destino: "document", esRsc: false }),
  null,
  "de la portada normal a un listado: sigue",
);
eq(
  vueltaALaPrevia({ url: `${O}/images/logo.png`, referer: PREVIA, destino: "image", esRsc: false }),
  null,
  "una imagen pedida por la vista previa: sigue",
);
eq(
  vueltaALaPrevia({ url: `${O}/api/contacto`, referer: PREVIA, destino: "empty", esRsc: false }),
  null,
  "una llamada a /api: sigue",
);
eq(
  vueltaALaPrevia({ url: `${O}/venta-pisos`, referer: "https://otra.com/preview/home", destino: "iframe", esRsc: false }),
  null,
  "referer de otro sitio: sigue",
);
eq(
  vueltaALaPrevia({ url: `${O}/venta-pisos`, referer: "no es una url", destino: "iframe", esRsc: false }),
  null,
  "referer roto: sigue",
);

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\npreview-salida: todo bien");
