// Fotos de las tarjetas con la marca de agua de la agencia. Sin framework:
// afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/card-images.test.ts
import { resolveCardImages, watermarkOn } from "./card-images";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

console.log("watermarkOn");
eq(watermarkOn(null, true), true, "sin nada en el anuncio manda la cuenta (encendida)");
eq(watermarkOn(null, false), false, "sin nada en el anuncio manda la cuenta (apagada)");
eq(watermarkOn({ enabled: false }, true), false, "el anuncio la apaga aunque la cuenta la tenga");
eq(watermarkOn({ enabled: true }, false), true, "el anuncio la enciende aunque la cuenta no");
eq(watermarkOn('{"enabled":true}', false), true, "también si llega como texto");
eq(watermarkOn("{roto", true), true, "JSON roto: manda la cuenta");
eq(watermarkOn({}, true), true, "objeto vacío: manda la cuenta");

const url = (order: number) => `https://b.s3.eu-west-3.amazonaws.com/accounts/21/watermarked/9/image_${order}.jpg`;
const row = { imageUrl: "https://x/a.jpg", imageUrl2: "https://x/b.jpg", imageOrder: 1, imageOrder2: 2 };

console.log("resolveCardImages");
const on = resolveCardImages(row, true, url);
eq(on.imageUrl, url(1), "con marca: la primera es la copia horneada");
eq(on.imageUrl2, url(2), "con marca: la segunda, la suya, no la misma");
eq(on.imageUrlFallback, "https://x/a.jpg", "la original queda de reserva");
eq(on.imageUrl2Fallback, "https://x/b.jpg", "la original de la segunda también");

const off = resolveCardImages(row, false, url);
eq(off.imageUrl, "https://x/a.jpg", "sin marca: la original");
eq(off.imageUrlFallback, null, "sin marca: sin reserva");

const noBucket = resolveCardImages(row, true, () => null);
eq(noBucket.imageUrl, "https://x/a.jpg", "sin bucket configurado: la original");
eq(noBucket.imageUrlFallback, null, "sin bucket: sin reserva");

const onePhoto = resolveCardImages({ ...row, imageUrl2: null, imageOrder2: null }, true, url);
eq(onePhoto.imageUrl2, null, "una sola foto: la segunda sigue vacía");

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
