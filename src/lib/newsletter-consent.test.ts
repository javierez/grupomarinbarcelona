// La caja «Suscríbete» del blog: qué permiso deja apuntado. Sin framework:
// afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/newsletter-consent.test.ts
import { subscriberConsent } from "./newsletter-consent";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log("subscriberConsent");
ok(
  same(subscriberConsent({ status: "not_asked", categories: null }), {
    status: "accepted",
    categories: null,
  }),
  "a quien nadie preguntó: aceptado, sin casillas",
);
ok(
  same(
    subscriberConsent({
      status: "accepted",
      categories: {
        property_notifications: true,
        commercial_communications: false,
        appointment_reminders: false,
        document_notifications: true,
      },
    })?.categories,
    {
      property_notifications: true,
      commercial_communications: true,
      appointment_reminders: false,
      document_notifications: true,
    },
  ),
  "solo cambia lo comercial: lo demás queda como lo dejó",
);
ok(
  same(subscriberConsent({ status: "withdrawn", categories: null })?.categories, {
    property_notifications: false,
    commercial_communications: true,
    appointment_reminders: false,
    document_notifications: false,
  }),
  "se dio de baja de todo y ahora se suscribe: solo vuelve lo comercial",
);
ok(
  subscriberConsent({ status: "restricted", categories: null }) === null,
  "quien se opuso al tratamiento no se toca",
);

console.log(failed === 0 ? "\nTodo bien" : `\n${failed} fallos`);
if (failed > 0) process.exit(1);
