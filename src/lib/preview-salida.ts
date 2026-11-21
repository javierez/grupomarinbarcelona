/**
 * La vista previa del editor («Mi web» en Vesta) vive en `/preview/*`, firmada
 * para una cuenta. Fuera de ahí, este servidor pinta su cuenta por defecto
 * (`NEXT_PUBLIC_ACCOUNT_ID`): un clic en «Comprar» o «Ver todas» dentro del
 * marco enseñaba los pisos de otra agencia (Muñoz Espasande, de Gijón, veía
 * los de León el 18-nov-2026). Una navegación que sale de la vista previa
 * vuelve a la página de la que salió.
 */

/** Adónde se devuelve esta petición, o null si sigue su camino. */
export function vueltaALaPrevia(peticion: {
  url: string;
  referer: string | null;
  /** `sec-fetch-dest` de la petición. */
  destino: string | null;
  /** Lleva la cabecera `rsc`: una navegación de Next en el navegador. */
  esRsc: boolean;
}): string | null {
  const url = new URL(peticion.url);
  if (/^\/(preview|_next|api)(\/|$)/.test(url.pathname)) return null;
  const navega =
    peticion.esRsc || peticion.destino === "document" || peticion.destino === "iframe";
  if (!navega || !peticion.referer) return null;
  let desde: URL;
  try {
    desde = new URL(peticion.referer);
  } catch {
    return null;
  }
  if (desde.origin !== url.origin || !desde.pathname.startsWith("/preview/")) return null;
  return desde.toString();
}
