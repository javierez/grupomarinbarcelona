// Qué acepta el campo contactProps.callNumber (botón flotante de llamar).
// Sin framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/call-number.test.ts
import { toTelHref } from "./call-number";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

console.log("toTelHref");
eq(toTelHref("937 024 607"), "tel:+34937024607", "fijo con espacios");
eq(toTelHref("663946837"), "tel:+34663946837", "móvil");
eq(toTelHref("+34 937-024-607"), "tel:+34937024607", "con prefijo y guiones");
eq(toTelHref("0034937024607"), null, "prefijo 0034 no se adivina");
eq(toTelHref(""), null, "vacío = sin botón");
eq(toTelHref(undefined), null, "ausente = sin botón");
eq(toTelHref("93702460"), null, "8 cifras");
eq(toTelHref("537024607"), null, "empieza por 5");

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\nTodo bien");
