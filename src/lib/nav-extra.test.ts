// Los enlaces que la agencia añade al menú: se pinta lo válido, enlace a
// enlace. Sin framework: afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/nav-extra.test.ts
import { enlacesDelMenu, esEnlaceValido, ordenDelMenu, MAX_ENLACES_DEL_MENU } from "./nav-extra";

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

console.log("\nesEnlaceValido");
ok(esEnlaceValido("/reformas"), true, "una página de la web");
ok(esEnlaceValido("/venta-pisos/en-leon"), true, "una búsqueda");
ok(esEnlaceValido("https://www.idealista.com/pro/ana"), true, "https");
ok(esEnlaceValido("tel:+34600000000"), true, "teléfono");
ok(esEnlaceValido("mailto:hola@agencia.es"), true, "correo");
ok(esEnlaceValido("http://agencia.es"), false, "http no");
ok(esEnlaceValido("javascript:alert(1)"), false, "javascript: no");
ok(esEnlaceValido("//otra.web/x"), false, "«//» es otra web");
ok(esEnlaceValido("reformas"), false, "sin barra no");

console.log("\nenlacesDelMenu");
ok(enlacesDelMenu(undefined), [], "sin campo, sin enlaces");
ok(enlacesDelMenu("[]"), [], "un texto no es una lista");
ok(
  enlacesDelMenu([
    { texto: " Reformas ", href: "/reformas-integrales" },
    { texto: "Idealista", href: "https://www.idealista.com/pro/ana", nuevaPestana: true },
  ]),
  [
    { texto: "Reformas", href: "/reformas-integrales" },
    { texto: "Idealista", href: "https://www.idealista.com/pro/ana", nuevaPestana: true },
  ],
  "dos buenos, recortados",
);
ok(
  enlacesDelMenu([
    { texto: "Roto", href: "javascript:alert(1)" },
    { texto: "", href: "/vacio" },
    { texto: "Un texto de menú demasiado largo", href: "/largo" },
    { texto: "Bueno", href: "/bueno" },
    { texto: "Repetido", href: "/bueno" },
    null,
  ]),
  [{ texto: "Bueno", href: "/bueno" }],
  "uno roto no se lleva a los demás; la dirección repetida, fuera",
);
ok(
  enlacesDelMenu(Array.from({ length: 9 }, (_, i) => ({ texto: `E${i}`, href: `/e${i}` }))).length,
  MAX_ENLACES_DEL_MENU,
  "como mucho seis",
);
ok(enlacesDelMenu([{ texto: "A", href: "/a", nuevaPestana: "sí" }]), [{ texto: "A", href: "/a" }], "nuevaPestana solo si es true");

console.log("\nordenDelMenu");
ok(ordenDelMenu(["venta", "extra:/reformas"]), ["venta", "extra:/reformas"], "lista de claves");
ok(ordenDelMenu(["venta", 3]), undefined, "con algo que no es texto, sin orden");
ok(ordenDelMenu(undefined), undefined, "sin campo");

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
