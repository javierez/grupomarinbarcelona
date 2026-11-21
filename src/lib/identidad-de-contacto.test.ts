// Quien escribe desde la web y ya está en el CRM se reconoce con otro formato
// de correo o de teléfono, y su teléfono va donde lo pondría el CRM. Sin
// framework: afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/identidad-de-contacto.test.ts
import {
  correoParaBuscar,
  errorDelTelefono,
  patronesDelTelefono,
  separarPrefijo,
  telefonoLocal,
  telefonoParaLaFicha,
  TELEFONO_DEMASIADO_LARGO,
} from "./identidad-de-contacto";

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

console.log("\ncorreoParaBuscar");
ok(correoParaBuscar("Ana@X.es "), "ana@x.es", "mayúsculas y espacio fuera");
ok(correoParaBuscar("  "), null, "vacío, nada");
ok(correoParaBuscar(undefined), null, "sin correo, nada");

console.log("\ntelefonoLocal");
for (const escrito of [
  "600 111 222",
  "600-111-222",
  "+34 600111222",
  "+34 (600) 11 12 22",
  "0034600111222",
  "34600111222",
]) {
  ok(telefonoLocal(escrito), "600111222", `«${escrito}» es 600111222`);
}
ok(telefonoLocal("3460011122"), "3460011122", "un 34 delante de 8 cifras no es el prefijo");

console.log("\nsepararPrefijo (extractPhonePrefix del CRM)");
ok(separarPrefijo("+44 7724 123456"), { prefijo: "+44", numero: "7724123456" }, "uno de fuera con «+»");
ok(separarPrefijo("0044 7724 123456"), { prefijo: "+44", numero: "7724123456" }, "«00» es «+»");
ok(separarPrefijo("+351 962 867 500"), { prefijo: "+351", numero: "962867500" }, "«351» antes que «35»");
ok(separarPrefijo("33 607 864 104"), { prefijo: "+33", numero: "607864104" }, "el país sin «+»");
ok(separarPrefijo("600111222"), { prefijo: "+34", numero: "600111222" }, "sin país, España");

console.log("\npatronesDelTelefono");
ok(patronesDelTelefono("+34 600 111 222"), ["%600111222"], "español: que acabe en sus 9 cifras");
ok(
  patronesDelTelefono("+44 7724 123456"),
  ["%7724123456", "%47724123456"],
  "de fuera: sin el país y con parte de él",
);
ok(patronesDelTelefono("12345"), [], "con menos de 6 cifras, nada");
ok(patronesDelTelefono(null), [], "sin teléfono, nada");

console.log("\ntelefonoParaLaFicha (phoneUpdateForKnownContact del CRM)");
const ficha = (phone: string | null, secondaryPhone: string | null) => ({ phone, secondaryPhone });
ok(
  telefonoParaLaFicha(ficha("", null), "606593185"),
  { phone: "606593185", phonePrefix: "+34" },
  "sin teléfono en la ficha, el que llega es el principal",
);
ok(
  telefonoParaLaFicha(ficha(null, "606593185"), "+34606593185"),
  { phone: "606593185", phonePrefix: "+34", secondaryPhone: null, secondaryPhonePrefix: null },
  "si estaba escondido en el secundario, sube al principal",
);
ok(
  telefonoParaLaFicha(ficha("600111222", null), "606593185"),
  { secondaryPhone: "606593185", secondaryPhonePrefix: "+34" },
  "con otro principal, va a secundario",
);
ok(
  telefonoParaLaFicha(ficha("606593185", null), "+34 606 593 185"),
  {},
  "el mismo número con prefijo no cambia nada",
);
ok(
  telefonoParaLaFicha(ficha("600111222", "611222333"), "606593185"),
  {},
  "con los dos ocupados no se pisa",
);
ok(telefonoParaLaFicha(ficha("", null), "12345"), {}, "corto, nada");
ok(telefonoParaLaFicha(ficha("", null), null), {}, "sin número, nada");
ok(
  telefonoParaLaFicha(ficha(null, null), "+351 962 867 500"),
  { phone: "962867500", phonePrefix: "+351" },
  "uno de fuera, con su país en la columna",
);

console.log("\nerrorDelTelefono");
ok(errorDelTelefono("+34 600 111 222"), null, "uno normal cabe");
ok(errorDelTelefono(`  ${"6".repeat(20)}  `), null, "20 cifras con espacios a los lados caben");
ok(errorDelTelefono("6".repeat(21)), TELEFONO_DEMASIADO_LARGO, "21 no caben: se dice, no se recorta");
ok(errorDelTelefono(undefined), null, "sin teléfono no es este error");

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
