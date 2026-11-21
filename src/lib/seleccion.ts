/**
 * Señalar un trozo de la web desde «Mi web» (contrato web-por-chat §6.1): la
 * agencia no sabe cómo se llama cada cosa, así que pincha en ella y el chat
 * recibe qué es y de qué campo sale. Aquí lo que no toca la página: los
 * mensajes y cómo se arma lo elegido con lo que el script lee de ella.
 */
import { NOMBRE_DEL_BLOQUE, definicionDe, type TipoDeElemento } from "./seleccion-claves";

/** El aviso de «ya estoy» de la vista (§6), con lo que sabe hacer. */
export const MENSAJE_LISTO = { type: "vesta:preview-ready", capacidades: ["seleccionar"] } as const;

export type ElementoSeleccionado = {
  clave: string;
  etiqueta: string;
  tipo: TipoDeElemento;
  ruta: string;
  campo?: string;
  texto?: string;
  imagen?: string;
  listingId?: string;
  testimonialId?: string;
  bloque?: { pagina: string; indice: number; tipo: string };
};

/** Un `data-vesta` de la página con los suyos (`data-vesta-id`, `-i`, `-nombre`, `-pagina`, `-bloque`). */
export type Marca = {
  clave: string;
  id?: string;
  i?: string;
  nombre?: string;
  pagina?: string;
  bloque?: string;
};

export const MAX_TEXTO = 200;
/** Un nombre más largo que esto no es el de un botón: es un párrafo. */
const MAX_NOMBRE = 40;

/** `{ type: "vesta:seleccionar", activo }` → activo; cualquier otra cosa → null. */
export function ordenDeSeleccion(data: unknown): boolean | null {
  if (!data || typeof data !== "object") return null;
  const { type, activo } = data as { type?: unknown; activo?: unknown };
  if (type !== "vesta:seleccionar" || typeof activo !== "boolean") return null;
  return activo;
}

export function recortar(texto: string | null | undefined, max = MAX_TEXTO): string | undefined {
  const limpio = texto?.replace(/\s+/g, " ").trim();
  if (!limpio) return undefined;
  return limpio.length > max ? limpio.slice(0, max) : limpio;
}

/** La foto de verdad, no la copia que sirve `next/image` ni el proxy `/api/image`. */
export function imagenOriginal(src: string | null | undefined, base: string): string | undefined {
  if (!src) return undefined;
  try {
    const url = new URL(src, base);
    if (url.origin === new URL(base).origin && (url.pathname === "/_next/image" || url.pathname === "/api/image")) {
      const original = url.searchParams.get("url");
      if (original) return new URL(original, base).toString();
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Lo elegido, de la marca más cercana al ratón (`marcas[0]`) hacia fuera: la
 * más cercana que está en el mapa es el elemento; las de fuera ponen el piso,
 * la opinión o el bloque en el que está. Una clave fuera del mapa se salta.
 */
export function elementoDeLasMarcas(
  marcas: Marca[],
  vista: { ruta: string; texto?: string; imagen?: string },
): ElementoSeleccionado | null {
  const propia = marcas.findIndex((m) => definicionDe(m.clave));
  const marca = marcas[propia];
  const def = marca && definicionDe(marca.clave);
  if (!marca || !def) return null;

  const fuera = marcas.slice(propia);
  const idDe = (que: "listingId" | "testimonialId") =>
    fuera.find((m) => m.id && definicionDe(m.clave)?.id === que)?.id;
  const deBloque = fuera.find((m) => m.clave === "bloque");
  const indice = Number(deBloque?.i);
  const bloque =
    deBloque?.pagina && deBloque.bloque && Number.isInteger(indice) && indice >= 0
      ? { pagina: deBloque.pagina, indice, tipo: deBloque.bloque }
      : undefined;

  const texto = recortar(vista.texto);
  // Un botón o un enlace se llaman por lo que pone; lo demás, solo si trae nombre.
  const nombre = [
    marca.nombre?.trim(),
    marca.clave === "bloque" && deBloque?.bloque
      ? (NOMBRE_DEL_BLOQUE as Record<string, string>)[deBloque.bloque]
      : undefined,
    (def.tipo === "boton" || def.tipo === "enlace") && texto && texto.length <= MAX_NOMBRE
      ? texto
      : undefined,
  ].find((n) => !!n);
  const etiqueta = def.conNombre && nombre ? def.conNombre.replace("{nombre}", nombre) : def.etiqueta;

  const campo = def.campo && conIndice(def.campo, marca.i);
  const listingId = idDe("listingId");
  const testimonialId = idDe("testimonialId");
  return {
    clave: marca.clave,
    etiqueta,
    tipo: def.tipo,
    ruta: vista.ruta,
    ...(campo ? { campo } : {}),
    ...(texto ? { texto } : {}),
    ...(def.tipo === "imagen" && vista.imagen ? { imagen: vista.imagen } : {}),
    ...(listingId ? { listingId } : {}),
    ...(testimonialId ? { testimonialId } : {}),
    ...(bloque ? { bloque } : {}),
  };
}

/** `contactProps.offices[{i}].phoneNumbers.main` con la oficina 0, o la lista entera sin índice. */
function conIndice(campo: string, i: string | undefined): string {
  if (!campo.includes("[{i}]")) return campo;
  return i !== undefined && /^\d+$/.test(i)
    ? campo.replace("[{i}]", `[${i}]`)
    : campo.slice(0, campo.indexOf("[{i}]"));
}

