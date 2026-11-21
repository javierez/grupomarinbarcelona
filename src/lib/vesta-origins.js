// @ts-check
// JS y no TS porque también lo importa next.config.js.

/**
 * Quién puede enmarcar la web (contrato web-por-chat §5): el CRM, sus
 * subdominios y el CRM en local (3000, o 3001 si el 3000 está cogido). En
 * todas las páginas, no solo en /preview: el CRM enseña la web de verdad, con
 * el borrador, dentro de un iframe.
 */
const CRM_EN_LOCAL = ["http://localhost:3000", "http://localhost:3001"];

export const VESTA_FRAME_ANCESTORS = [
  "'self' https://vesta-crm.com https://*.vesta-crm.com",
  ...CRM_EN_LOCAL,
].join(" ");

const SUBDOMINIO_DE_VESTA = /^https:\/\/([a-z0-9-]+\.)+vesta-crm\.com$/;

/**
 * Los mismos orígenes, para el `message` del borrador en vivo (§6). El propio
 * origen de la web lo comprueba quien llama.
 *
 * @param {string} origin
 * @returns {boolean}
 */
export function esOrigenDeVesta(origin) {
  return (
    origin === "https://vesta-crm.com" ||
    CRM_EN_LOCAL.includes(origin) ||
    SUBDOMINIO_DE_VESTA.test(origin)
  );
}

/**
 * Quién puede mandar órdenes a la web enmarcada (§6 y §6.1): el CRM o la
 * propia web. Un origen opaco («null», un iframe en sandbox) no es «la propia».
 *
 * @param {string} origin el de quien manda el mensaje
 * @param {string} propio el de la web (`window.location.origin`)
 * @returns {boolean}
 */
export function esPadrePermitido(origin, propio) {
  return (origin === propio && origin !== "null") || esOrigenDeVesta(origin);
}
