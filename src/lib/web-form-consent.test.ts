// Lo que guarda un formulario de la web con la casilla de términos y
// privacidad. Sin framework: afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/web-form-consent.test.ts
import { webFormTermsAccepted } from "./web-form-consent";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

console.log("webFormTermsAccepted");
const now = new Date("2026-11-14T10:00:00Z");
const c = webFormTermsAccepted(now);
ok(c.termsAcceptedAt === "2026-11-14T10:00:00.000Z", "la fecha del envío, en ISO");
ok(
  Object.keys(c).length === 1 && Object.keys(c)[0] === "termsAcceptedAt",
  "solo la fecha de aceptación",
);
ok(
  !Object.keys(c).some((k) => k.toLowerCase().includes("gdpr")),
  "ningún campo RGPD: el contacto se queda en not_asked",
);
ok(webFormTermsAccepted(new Date()) !== c, "un objeto nuevo en cada llamada");

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
