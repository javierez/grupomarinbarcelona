import { cache } from "react";
import type { Metadata } from "next";
import { esMuestra, type PaginaWeb } from "~/lib/pagina-propia";
import { getSiteUrl } from "~/lib/site-url";
import { borradorDeLaPeticion } from "~/server/borrador";
import { getFeaturesProps } from "./website-config";

/**
 * La página propia de esta dirección del catch-all (`[...slug]`), o null.
 * Un solo tramo y que esté en `features_props.paginas` (`paginasDeLaWeb` ya
 * dejó fuera las direcciones reservadas y las búsquedas). Las muestras
 * («_muestra-1…3»), solo con el enlace del borrador: sin él, 404.
 */
export const paginaPropia = cache(
  async (ruta: string): Promise<{ pagina: PaginaWeb; borrador: boolean } | null> => {
    if (ruta.includes("/")) return null;
    const { paginas } = await getFeaturesProps();
    const pagina = paginas?.find((p) => p.slug === ruta);
    if (!pagina) return null;
    const borrador = (await borradorDeLaPeticion()) !== null;
    if (esMuestra(pagina.slug) && !borrador) return null;
    return { pagina, borrador };
  },
);

/** «Título | Marca» por la plantilla del layout; la muestra, nunca indexada (el borrador ya no lo es). */
export function metadataDePaginaPropia(pagina: PaginaWeb): Metadata {
  return {
    title: pagina.titulo,
    description: pagina.descripcion,
    alternates: { canonical: `${getSiteUrl()}/${pagina.slug}` },
    ...(esMuestra(pagina.slug) ? { robots: { index: false, follow: false } } : {}),
  };
}
