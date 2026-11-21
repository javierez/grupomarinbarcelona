/**
 * Los enlaces que la agencia añade al menú (`features_props.navExtra`,
 * contrato web-por-chat §10). Sin zod a propósito: lo lee también el navegador
 * (el borrador en vivo repinta la barra) y zod no tiene por qué viajar a cada
 * visita.
 *
 * Las reglas son las del CRM (`~/server/website/paginas-reglas.ts`): el CRM
 * las aplica al guardar y aquí se vuelven a mirar al pintar, enlace a enlace,
 * así que uno roto se cae solo y no se lleva la barra entera.
 */

export type EnlaceDelMenu = { texto: string; href: string; nuevaPestana?: boolean };

export const MAX_ENLACES_DEL_MENU = 6;
const MAX_TEXTO = 24;

/** Evento con el que el borrador en vivo le pasa a la barra el menú nuevo. */
export const MENU_EN_VIVO = "vesta:menu";
export type MenuEnVivo = { navExtra: EnlaceDelMenu[]; navOrder?: string[] };

/**
 * Adónde lleva un enlace o un botón: una dirección de la web («/reformas»,
 * «/venta-pisos/en-leon»), una https, un teléfono o un correo. Ni «http://»
 * (el navegador lo bloquea dentro de una web https) ni «javascript:».
 * La misma expresión que el CRM.
 */
export function esEnlaceValido(href: string): boolean {
  return (
    /^\/(?![/\\])\S*$/.test(href) ||
    /^https:\/\/[^\s/]+\.[^\s]+$/.test(href) ||
    /^(tel|mailto):\S+$/.test(href)
  );
}

/** «/reformas» se navega con Link; https, tel y mailto con un <a>. */
export function esEnlaceInterno(href: string): boolean {
  return href.startsWith("/");
}

/** La clave de un enlace propio en `features_props.navOrder`. */
export function claveDelEnlace(href: string): `extra:${string}` {
  return `extra:${href}`;
}

/** Los enlaces que se pueden pintar, en su orden, sin repetir dirección y como mucho seis. */
export function enlacesDelMenu(raw: unknown): EnlaceDelMenu[] {
  if (!Array.isArray(raw)) return [];
  const vistos = new Set<string>();
  const out: EnlaceDelMenu[] = [];
  for (const item of raw as unknown[]) {
    if (out.length === MAX_ENLACES_DEL_MENU) break;
    if (typeof item !== "object" || item === null) continue;
    const { texto, href, nuevaPestana } = item as Record<string, unknown>;
    if (typeof texto !== "string" || typeof href !== "string") continue;
    const t = texto.trim();
    const h = href.trim();
    if (!t || t.length > MAX_TEXTO || h.length > 500 || !esEnlaceValido(h) || vistos.has(h)) continue;
    vistos.add(h);
    out.push(nuevaPestana === true ? { texto: t, href: h, nuevaPestana: true } : { texto: t, href: h });
  }
  return out;
}

/** `navOrder` tal cual si es una lista de textos; si no, sin orden. */
export function ordenDelMenu(raw: unknown): string[] | undefined {
  return Array.isArray(raw) && raw.every((k): k is string => typeof k === "string") ? raw : undefined;
}
