// Qué acepta la caja de "Google Analytics" del editor. Sin framework: afirma,
// imprime un resumen y sale != 0, como el resto de tests del repo.
//
//   pnpm tsx src/lib/google-tag.test.ts
import { isLegacyUniversalId, parseGoogleTag } from "./google-tag";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${e}\n      obtenido: ${a}`);
}

console.log("parseGoogleTag");

eq(parseGoogleTag("G-7YRQKT91SK"), { id: "G-7YRQKT91SK", kind: "ga4" }, "id suelto");
eq(parseGoogleTag("  g-7yrqkt91sk \n")?.id, "G-7YRQKT91SK", "recorta y pasa a mayúsculas");

// El caso que importa: esto es lo que Google deja en el portapapeles.
eq(
  parseGoogleTag(`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-7YRQKT91SK"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  gtag('config', 'G-7YRQKT91SK');
</script>`),
  { id: "G-7YRQKT91SK", kind: "ga4" },
  "saca el id del fragmento de gtag.js",
);

eq(
  parseGoogleTag("https://www.googletagmanager.com/gtag/js?id=G-ABCD1234")?.id,
  "G-ABCD1234",
  "acepta sólo la URL del cargador",
);

eq(parseGoogleTag("GTM-ABC1234"), { id: "GTM-ABC1234", kind: "gtm" }, "contenedor de Tag Manager");

// "GTM-ABC1234" contiene algo con forma de G-…; tiene que ganar el contenedor.
eq(
  parseGoogleTag(`(function(w,d,s,l,i){})(window,document,'script','dataLayer','GTM-ABC1234');`),
  { id: "GTM-ABC1234", kind: "gtm" },
  "no confunde un GTM con un G-",
);

eq(parseGoogleTag("UA-123456-1"), null, "rechaza Universal Analytics (muerto desde 2023)");
eq(isLegacyUniversalId("UA-123456-1"), true, "y sabe decir por qué");

for (const input of ["", "   ", null, undefined, "aquí no hay nada", "G-"]) {
  eq(parseGoogleTag(input), null, `rechaza ${JSON.stringify(input)}`);
}

// Sólo viaja el id, nunca el marcado que lo rodeaba.
eq(parseGoogleTag(`<script>alert(1)</script> G-REAL1234`)?.id, "G-REAL1234", "no devuelve el script");

console.log(failed === 0 ? "\nTodo OK" : `\n${failed} fallo(s)`);
process.exit(failed === 0 ? 0 : 1);
