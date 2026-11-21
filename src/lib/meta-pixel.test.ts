// Qué acepta la caja de "Meta Pixel" del editor. Sin framework: afirma,
// imprime un resumen y sale != 0, como el resto de tests del repo.
//
//   pnpm tsx src/lib/meta-pixel.test.ts
import { parseMetaPixel } from "./meta-pixel";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

console.log("parseMetaPixel");
eq(parseMetaPixel("141308383173955"), "141308383173955", "el número de Active House");
eq(parseMetaPixel("  141308383173955 \n"), "141308383173955", "recorta espacios");
eq(
  parseMetaPixel(`<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){};}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '719989114529544');
fbq('track', 'PageView');
</script>`),
  "719989114529544",
  "el bloque entero que da Meta",
);
eq(parseMetaPixel("G-734HX2846Z"), null, "un id de Google no es un píxel");
eq(parseMetaPixel("123"), null, "demasiado corto");
eq(parseMetaPixel(""), null, "vacío");
eq(parseMetaPixel(null), null, "null");

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\nmeta-pixel: todo bien");
