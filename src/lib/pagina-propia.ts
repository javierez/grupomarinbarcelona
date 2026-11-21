/**
 * Las páginas propias de la agencia (`features_props.paginas`, contrato
 * web-por-chat §10): su forma, qué direcciones no pueden tener y qué son las
 * muestras. Copia de `~/server/website/paginas-reglas.ts` del CRM, que las
 * valida al guardar; `pagina-propia.test.ts` comprueba que la lista de
 * direcciones reservadas es la de las carpetas de `src/app`.
 *
 * Aquí se leen al pintar, bloque a bloque: uno que no cuadra se cae solo y la
 * página sigue en pie.
 */
import { z } from "zod";
import { esEnlaceValido } from "./nav-extra";
import { buildSearchSlug, isSearchSlug, normalizePropertyTypes, parseSearchSlug } from "./search-utils";

/**
 * Las rutas de primer nivel de la plantilla y sus redirecciones (`/noticias`,
 * `/noticia/*` → `/blog`): una página con una de estas direcciones no se vería
 * nunca. Una carpeta nueva en `src/app` va también aquí y en el CRM.
 */
export const SLUGS_RESERVADOS = [
  "anuncios",
  "api",
  "aviso-legal",
  "blog",
  "coleccion",
  "contacto",
  "cookies",
  "enlaces-de-interes",
  "faqs",
  "inversiones",
  "nosotros",
  "noticia",
  "noticias",
  "preview",
  "promociones",
  "propiedades",
  "proteccion-de-datos",
  "reformas",
  "servicios",
  "terminos-condiciones-venta",
  "vender",
] as const;

/** Reservada, o una búsqueda («venta…», «alquil…», «todo…»), que el buscador se queda antes. */
export function esSlugReservado(slug: string): boolean {
  return (SLUGS_RESERVADOS as readonly string[]).includes(slug) || isSearchSlug(slug);
}

/** Un tramo de dirección: minúsculas, cifras y guiones sueltos («reformas-integrales»). */
export const SLUG_DE_PAGINA = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Las versiones que el chat enseña para elegir: solo con el enlace del borrador. */
export function esMuestra(slug: string): boolean {
  return /^_muestra-[1-3]$/.test(slug);
}

export const MAX_PAGINAS = 20;
export const MAX_BLOQUES = 20;

/** Los tipos del menú Venta / Alquiler (`BUY_ITEMS` de `navbar.tsx`). */
export const TIPOS_DE_INMUEBLE = [
  "pisos",
  "casas",
  "locales",
  "solares",
  "garajes",
  "naves-industriales",
] as const;

const texto = (max: number) => z.string().trim().min(1).max(max);
const opcional = (max: number) => z.string().trim().max(max).optional();
const enlace = z.string().trim().max(500).refine(esEnlaceValido);
const imagen = z
  .string()
  .trim()
  .max(1000)
  .refine((u) => /^https:\/\/\S+$/.test(u));
const boton = z.object({ texto: texto(30), href: enlace });

const bloqueSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("cabecera"),
    titulo: texto(120),
    subtitulo: opcional(300),
    imagen: imagen.optional(),
    boton: boton.optional(),
  }),
  z.object({
    tipo: z.literal("texto"),
    titulo: opcional(120),
    texto: texto(4000),
    imagen: imagen.optional(),
    imagenLado: z.enum(["izquierda", "derecha"]).optional(),
  }),
  z.object({
    tipo: z.literal("inmuebles"),
    titulo: opcional(120),
    operacion: z.enum(["venta", "alquiler"]).optional(),
    tipos: z.array(z.enum(TIPOS_DE_INMUEBLE)).max(TIPOS_DE_INMUEBLE.length).optional(),
    ciudad: opcional(80),
    precioMax: z.number().int().positive().optional(),
    limite: z.number().int().min(1).max(12).optional(),
  }),
  z.object({
    tipo: z.literal("galeria"),
    titulo: opcional(120),
    imagenes: z.array(imagen).min(1).max(12),
  }),
  z.object({
    tipo: z.literal("formulario"),
    titulo: opcional(120),
    modo: z.enum(["contacto", "vender", "valorar"]),
  }),
  z.object({
    tipo: z.literal("preguntas"),
    titulo: opcional(120),
    items: z
      .array(z.object({ pregunta: texto(200), respuesta: texto(2000) }))
      .min(1)
      .max(15),
  }),
  z.object({
    tipo: z.literal("llamada"),
    titulo: texto(120),
    texto: opcional(500),
    boton,
  }),
  z.object({
    tipo: z.literal("testimonios"),
    titulo: opcional(120),
  }),
]);

const paginaSchema = z.object({
  slug: z
    .string()
    .max(60)
    .refine((s) => esMuestra(s) || (SLUG_DE_PAGINA.test(s) && !esSlugReservado(s))),
  titulo: texto(70),
  descripcion: opcional(160),
  bloques: z.array(z.unknown()).max(MAX_BLOQUES),
});

export type Bloque = z.infer<typeof bloqueSchema>;
export type BloqueDe<T extends Bloque["tipo"]> = Extract<Bloque, { tipo: T }>;
export type PaginaWeb = Omit<z.infer<typeof paginaSchema>, "bloques"> & { bloques: Bloque[] };

/**
 * Las páginas que se pueden pintar: forma buena, dirección libre y sin
 * repetir, con al menos un bloque bueno. Hasta 20 de verdad; las muestras
 * (como mucho 3, por su forma) aparte.
 */
export function paginasDeLaWeb(raw: unknown): PaginaWeb[] {
  if (!Array.isArray(raw)) return [];
  const vistas = new Set<string>();
  const out: PaginaWeb[] = [];
  for (const item of raw as unknown[]) {
    const pagina = paginaSchema.safeParse(item);
    if (!pagina.success || vistas.has(pagina.data.slug)) continue;
    const muestra = esMuestra(pagina.data.slug);
    if (!muestra && out.filter((p) => !esMuestra(p.slug)).length === MAX_PAGINAS) continue;
    const bloques = pagina.data.bloques.flatMap((b) => {
      const bloque = bloqueSchema.safeParse(b);
      return bloque.success ? [bloque.data] : [];
    });
    if (bloques.length === 0) continue;
    vistas.add(pagina.data.slug);
    out.push({ ...pagina.data, bloques });
  }
  return out;
}

/**
 * Un bloque de inmuebles es una búsqueda de la web: la dirección de «Ver
 * todos» («/venta-casas-pisos/en-gijon/con-precio-hasta_300000») y los
 * filtros que salen de leerla, los mismos que daría abrirla.
 */
export function busquedaDelBloque(bloque: BloqueDe<"inmuebles">) {
  const operacion = bloque.operacion === "alquiler" ? "alquiler" : "venta";
  const tipos = (bloque.tipos ?? []).map((t) => `-${t}`).join("");
  const { propertyType } = parseSearchSlug(`${operacion}${tipos}`);
  const slug = buildSearchSlug({
    status: operacion === "alquiler" ? "for-rent" : "for-sale",
    propertyType,
    cities: bloque.ciudad ? [bloque.ciudad] : undefined,
    maxPrice: bloque.precioMax,
  });
  const leido = parseSearchSlug(slug);
  const tiposLeidos = normalizePropertyTypes(leido.propertyType);
  return {
    href: `/${slug}`,
    limite: bloque.limite ?? 6,
    filtros: {
      status: leido.status === "for-rent" ? ("for-rent" as const) : ("for-sale" as const),
      propertyType: tiposLeidos.length > 0 ? tiposLeidos : undefined,
      cities: leido.cities,
      location: leido.location,
      maxPrice: leido.maxPrice,
    },
  };
}
