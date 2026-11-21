// El propietario que vuelve a escribir desde la web: se completa lo que
// faltaba y no se pisa lo suyo. Sin framework: afirma, imprime un resumen y
// sale != 0.
//
//   pnpm tsx src/lib/propietario-de-la-web.test.ts
import { cambiosDelPropietario, type ContactoQueYaEstaba } from "./propietario-de-la-web";

let failed = 0;

function ok(actual: unknown, expected: unknown, what: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.log(`  ✗ ${what}: esperado ${e}, recibido ${a}`);
}

const ahora = new Date("2026-11-15T12:00:00Z");
const datos = {
  email: "ana@correo.es",
  phone: "600111222",
  nota: "Lead generado vía formulario web (vender)",
  terminosAceptados: true,
};

console.log("\nun comprador que ya estaba, sin teléfono ni fase de captación");
const comprador: ContactoQueYaEstaba = {
  email: "ana@correo.es",
  phone: null,
  secondaryPhone: null,
  source: "Idealista",
  captacionStatus: null,
  additionalInfo: { notes: "Busca piso en Gijón", firstContactDate: "2026-10-01" },
};
const c1 = cambiosDelPropietario(comprador, datos, ahora);
ok("email" in c1, false, "su correo no se toca");
ok((c1 as { phone?: string }).phone, "600111222", "se completa el teléfono");
ok((c1 as { phonePrefix?: string }).phonePrefix, "+34", "con su país en la columna");
ok("source" in c1, false, "su origen (Idealista) se queda");
ok((c1 as { captacionStatus?: string }).captacionStatus, "pendiente", "entra en Captaciones");
ok((c1.additionalInfo as Record<string, unknown>).firstContactDate, "2026-10-01", "lo que tenía en additionalInfo sigue");
ok(
  c1.additionalInfo.notes,
  "Busca piso en Gijón\n[15/11/2026] Lead generado vía formulario web (vender)",
  "la nota va detrás de las suyas, con la fecha",
);
ok(c1.additionalInfo.termsAcceptedAt, "2026-11-15T12:00:00.000Z", "la casilla con su fecha");

console.log("\nun propietario que ya está en captación");
const enCaptacion: ContactoQueYaEstaba = {
  email: null,
  phone: "600111222",
  secondaryPhone: null,
  source: null,
  captacionStatus: "en_proceso",
  additionalInfo: null,
};
const c2 = cambiosDelPropietario(enCaptacion, { ...datos, terminosAceptados: false }, ahora);
ok("captacionStatus" in c2, false, "su fase no vuelve a «pendiente»");
ok((c2 as { email?: string }).email, "ana@correo.es", "se completa el correo");
ok((c2 as { source?: string }).source, "Website", "sin origen, Website");
ok(c2.additionalInfo.notes, "[15/11/2026] Lead generado vía formulario web (vender)", "sin notas, solo la nueva");
ok("termsAcceptedAt" in c2.additionalInfo, false, "sin casilla, no se apunta aceptación");
ok("phone" in c2 || "secondaryPhone" in c2, false, "el mismo teléfono no cambia nada");

console.log("\nencontrado por el correo, con otro teléfono");
const c3 = cambiosDelPropietario({ ...comprador, phone: "611222333" }, datos, ahora);
ok((c3 as { secondaryPhone?: string }).secondaryPhone, "600111222", "el nuevo va al secundario");
ok("phone" in c3, false, "el principal no se pisa");

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
