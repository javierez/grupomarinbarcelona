/**
 * Firmas entre el CRM y esta web (docs/plan/web-por-chat-contrato.md §2-§4).
 *
 * - §2 clave de la web: hex(HMAC_SHA256(PREVIEW_HMAC_SECRET, "web:" + accountId)).
 *   La calcula quien despliega y llega aquí como VESTA_CLAVE_WEB. La clave es
 *   el TEXTO hex de 64 caracteres (se firma con sus bytes UTF-8), no 32 bytes.
 * - §3 enlace de borrador: ?borrador=<exp>.<hex(HMAC(clave, "borrador:" + accountId + ":" + exp))>
 * - §4 revalidar: x-vesta-firma = hex(HMAC(clave, "revalidar:" + accountId + ":" + exp))
 *
 * Web Crypto y no node:crypto: lo usan el middleware (edge) y el servidor.
 * `crypto.subtle.verify` recalcula la firma y la compara él, en tiempo
 * constante; nunca se compara con `===`.
 */

export const BORRADOR_PARAM = "borrador";
export const BORRADOR_COOKIE = "vesta_borrador";
/** Lo pone el middleware tras comprobar el borrador; el que llega de fuera se borra. */
export const BORRADOR_HEADER = "x-vesta-borrador";
export const FIRMA_HEADER = "x-vesta-firma";

/** Un enlace dura 1 h; 5 min más de holgura por si los relojes no cuadran. */
export const MAX_ADELANTO_MS = 65 * 60 * 1000;

const encoder = new TextEncoder();

function aHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Sin tipo de retorno a mano: así TS infiere Uint8Array<ArrayBuffer>, que es
// lo que acepta crypto.subtle con los tipos de TS 5.9.
function deHex(hex: string) {
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) return null;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function importarClave(clave: string, uso: "sign" | "verify") {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(clave),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [uso],
  );
}

export async function hmacHex(clave: string, mensaje: string): Promise<string> {
  const key = await importarClave(clave, "sign");
  const firma = await crypto.subtle.sign("HMAC", key, encoder.encode(mensaje));
  return aHex(new Uint8Array(firma));
}

/** §2. Solo la usa el generador al desplegar; la web recibe ya el resultado. */
export function claveDeLaWeb(secreto: string, accountId: string): Promise<string> {
  return hmacHex(secreto, `web:${accountId}`);
}

async function firmaCorrecta(clave: string, mensaje: string, firmaHex: string) {
  const firma = deHex(firmaHex);
  if (!firma) return false;
  const key = await importarClave(clave, "verify");
  return crypto.subtle.verify("HMAC", key, firma, encoder.encode(mensaje));
}

/** Ni caducado ni más lejos de lo que un enlace de 1 h puede llegar. */
export function expVigente(exp: number, ahora: number): boolean {
  return Number.isSafeInteger(exp) && exp >= ahora && exp <= ahora + MAX_ADELANTO_MS;
}

type DeEstaWeb = {
  /** VESTA_CLAVE_WEB. Sin ella no hay borrador ni revalidación: todo da false. */
  clave: string | undefined;
  /** NEXT_PUBLIC_ACCOUNT_ID de este despliegue. */
  accountId: string;
  ahora?: number;
};

/** §3. `token` es el valor de ?borrador= (o de la cookie que lo guarda). */
export async function borradorValido(
  token: string | null | undefined,
  { clave, accountId, ahora = Date.now() }: DeEstaWeb,
): Promise<boolean> {
  if (!clave || !token) return false;
  const partes = /^([1-9]\d{0,15})\.([0-9a-fA-F]{64})$/.exec(token);
  if (!partes?.[1] || !partes[2]) return false;
  if (!expVigente(Number(partes[1]), ahora)) return false;
  return firmaCorrecta(clave, `borrador:${accountId}:${partes[1]}`, partes[2]);
}

/** Segundos que le quedan a un borrador ya validado (para el Max-Age de la cookie). */
export function segundosDeBorrador(token: string, ahora = Date.now()): number {
  const exp = Number(token.split(".")[0]);
  return Math.max(0, Math.floor((exp - ahora) / 1000));
}

/** §4. `cuerpo` es el JSON del POST; `firma`, la cabecera x-vesta-firma. */
export async function revalidacionValida(
  cuerpo: unknown,
  firma: string | null | undefined,
  { clave, accountId, ahora = Date.now() }: DeEstaWeb,
): Promise<boolean> {
  if (!clave || !firma || typeof cuerpo !== "object" || cuerpo === null) return false;
  const { accountId: deQuien, exp } = cuerpo as { accountId?: unknown; exp?: unknown };
  // Solo la propia cuenta: la clave de esta web no firma por otra.
  if (deQuien !== accountId || typeof exp !== "number") return false;
  if (!expVigente(exp, ahora)) return false;
  return firmaCorrecta(clave, `revalidar:${accountId}:${exp}`, firma);
}
