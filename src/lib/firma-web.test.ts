// Firmas del contrato web-por-chat (§2-§4): borrador y revalidar.
// Sin framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/firma-web.test.ts
import { createHmac } from "node:crypto";
import {
  borradorValido,
  claveDeLaWeb,
  expVigente,
  hmacHex,
  revalidacionValida,
  segundosDeBorrador,
} from "./firma-web";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

// Lo que hará el CRM (Node): el mismo HMAC con node:crypto, clave = texto hex.
const nodeHmac = (clave: string, msg: string) =>
  createHmac("sha256", clave).update(msg).digest("hex");

const SECRETO = "secreto-de-prueba";
const CUENTA = "265";
const AHORA = 1_763_000_000_000;

async function main() {
  console.log("clave de la web (§2)");
  const clave = await claveDeLaWeb(SECRETO, CUENTA);
  eq(clave, nodeHmac(SECRETO, "web:265"), "igual que createHmac de Node");
  eq(clave.length, 64, "64 caracteres hex");
  eq(await hmacHex(clave, "x"), nodeHmac(clave, "x"), "firma con el texto hex como clave");

  console.log("borrador (§3)");
  const exp = AHORA + 60 * 60 * 1000;
  const firma = nodeHmac(clave, `borrador:265:${exp}`);
  const web = { clave, accountId: CUENTA, ahora: AHORA };
  eq(await borradorValido(`${exp}.${firma}`, web), true, "enlace bien firmado");
  eq(await borradorValido(`${exp}.${firma.toUpperCase()}`, web), true, "firma en mayúsculas también");
  eq(await borradorValido(`${exp}.${firma}`, { ...web, ahora: exp + 1 }), false, "caducado");
  eq(await borradorValido(`${exp}.${firma}`, { ...web, accountId: "266" }), false, "firmado para otra cuenta");
  eq(await borradorValido(`${exp}.${firma}`, { ...web, clave: undefined }), false, "web sin VESTA_CLAVE_WEB");
  eq(await borradorValido(`${exp + 1}.${firma}`, web), false, "exp cambiado");
  eq(await borradorValido(`${exp}.${firma.slice(0, 63)}`, web), false, "firma corta");
  eq(await borradorValido(`0${exp}.${firma}`, web), false, "exp con cero delante");
  eq(await borradorValido("", web), false, "vacío");
  eq(await borradorValido(null, web), false, "ausente");
  const lejos = AHORA + 2 * 60 * 60 * 1000;
  eq(
    await borradorValido(`${lejos}.${nodeHmac(clave, `borrador:265:${lejos}`)}`, web),
    false,
    "más de 1 h + 5 min por delante",
  );
  eq(segundosDeBorrador(`${exp}.${firma}`, AHORA), 3600, "Max-Age de la cookie");

  console.log("revalidar (§4)");
  const expR = AHORA + 60_000;
  const firmaR = nodeHmac(clave, `revalidar:265:${expR}`);
  eq(await revalidacionValida({ accountId: "265", exp: expR }, firmaR, web), true, "petición bien firmada");
  eq(await revalidacionValida({ accountId: 265, exp: expR }, firmaR, web), false, "accountId como número");
  eq(await revalidacionValida({ accountId: "266", exp: expR }, firmaR, web), false, "otra cuenta");
  eq(await revalidacionValida({ accountId: "265", exp: String(expR) }, firmaR, web), false, "exp como texto");
  eq(await revalidacionValida({ accountId: "265", exp: expR }, firma, web), false, "firma de borrador no vale para revalidar");
  eq(await revalidacionValida({ accountId: "265", exp: expR }, null, web), false, "sin cabecera");
  eq(await revalidacionValida(null, firmaR, web), false, "sin cuerpo");

  console.log("expVigente");
  eq(expVigente(AHORA, AHORA), true, "justo ahora");
  eq(expVigente(AHORA - 1, AHORA), false, "un ms tarde");
  eq(expVigente(Number.NaN, AHORA), false, "NaN");
  eq(expVigente(AHORA + 0.5, AHORA), false, "no entero");

  if (failed > 0) {
    console.error(`\n${failed} fallo(s)`);
    process.exit(1);
  }
  console.log("\nTodo bien");
}

void main();
