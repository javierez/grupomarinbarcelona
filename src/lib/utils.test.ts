// El texto sobre una superficie pintada con primaryColor (pie con footerBrand,
// portada editorial, banda de contacto) sale por contraste: con un verde claro
// era blanco sobre verde claro y no se leía. Sin framework: afirma, imprime un
// resumen y sale != 0.
//
//   pnpm tsx src/lib/utils.test.ts
import { readableForegroundHsl, tintaSobrePrimario } from "./utils";

let failed = 0;

function ok(actual: string, expected: string, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.log(`  ✗ ${what}: esperado ${expected}, recibido ${actual}`);
}

const OSCURO = "0 0% 9%";
const BLANCO = "0 0% 98%";

console.log("\nreadableForegroundHsl");
ok(readableForegroundHsl("#cfe8c4"), OSCURO, "verde claro: texto oscuro");
ok(readableForegroundHsl("#ffffff"), OSCURO, "blanco: texto oscuro");
ok(readableForegroundHsl("#1f3b2d"), BLANCO, "verde oscuro: texto blanco");
ok(readableForegroundHsl("#141a26"), BLANCO, "la pizarra de siempre: texto blanco");
ok(readableForegroundHsl("rojo"), BLANCO, "lo que no es un hex: blanco, como antes");

console.log("\ntintaSobrePrimario");
ok(
  tintaSobrePrimario("#cfe8c4"),
  `var(--brand-primary-foreground, ${OSCURO})`,
  "lee la variable del body (borrador en vivo) y, sin ella, el contraste",
);
ok(tintaSobrePrimario("#1f3b2d"), `var(--brand-primary-foreground, ${BLANCO})`, "primario oscuro: blanco");

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
