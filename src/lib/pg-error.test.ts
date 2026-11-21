// Sin la vista `web_cuenta` (migración sin aplicar) la web lee `accounts` como
// hoy; cualquier otro fallo de la base sigue siendo un error. Sin framework:
// afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/pg-error.test.ts
import { faltaLaVista } from "./pg-error";

let failed = 0;

function ok(actual: boolean, expected: boolean, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.log(`  ✗ ${what}: esperado ${expected}, recibido ${actual}`);
}

console.log("\nfaltaLaVista");
ok(faltaLaVista({ code: "42P01", message: 'relation "web_cuenta" does not exist' }), true, "la vista no existe todavía");
ok(faltaLaVista({ code: "42501", message: "permission denied for view web_cuenta" }), true, "este rol no la puede leer");
ok(faltaLaVista(Object.assign(new Error("Failed query"), { cause: { code: "42P01" } })), true, "también envuelto en cause");
ok(faltaLaVista({ code: "57014", message: "canceling statement due to statement timeout" }), false, "un timeout es un error");
ok(faltaLaVista({ code: "08006", message: "connection failure" }), false, "sin conexión es un error");
ok(faltaLaVista(new Error("boom")), false, "un error sin código es un error");
ok(faltaLaVista(null), false, "null");

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
