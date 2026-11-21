import { cache } from "react";
import { unstable_cache } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { websiteProperties } from "~/server/db/schema";
import { env } from "~/env";
import { borradorDeLaPeticion } from "~/server/borrador";
import {
  SITE_CONFIG_KEYS,
  mergeDraft,
  siteConfigTag,
  type SiteConfigKey,
  type SiteConfigRow,
} from "~/lib/site-config-columns";

/**
 * La única lectura de `website_config` para pintar la web. Los getters de
 * cada sección (logo, colores, hero…) parten de aquí.
 *
 * - Lo publicado se guarda en la caché de datos con la etiqueta `web-<id>`:
 *   /api/revalidar la invalida al publicar y la web cambia al momento, sin
 *   build. Antes cada visita hacía ~10 SELECT a la misma fila.
 * - Con un enlace de borrador válido: la fila en vivo y el último borrador
 *   encima, sin caché.
 * - Otra cuenta (/preview del editor del CRM): en vivo, como siempre.
 */

const SITE_ACCOUNT_ID = env.NEXT_PUBLIC_ACCOUNT_ID;

/** Lo que cambia entre despliegues entra en la llave: un deploy no hereda la caché del anterior. */
const DESPLIEGUE = env.VERCEL_DEPLOYMENT_ID ?? env.VERCEL_GIT_COMMIT_SHA ?? "local";

/**
 * Red por si un cambio llega sin /api/revalidar (un script, el editor de
 * hoy): como mucho un minuto tarde. Con revalidar, al momento.
 */
const REVALIDAR_CADA_S = 60;

const COLUMNAS = Object.fromEntries(
  SITE_CONFIG_KEYS.map((k) => [k, websiteProperties[k]]),
) as { [K in SiteConfigKey]: (typeof websiteProperties)[K] };

async function leerFila(accountId: string): Promise<SiteConfigRow | null> {
  const [fila] = await db
    .select(COLUMNAS)
    .from(websiteProperties)
    .where(eq(websiteProperties.accountId, BigInt(accountId)))
    .limit(1);
  return fila ?? null;
}

/**
 * §1: el más nuevo sin publicar y posterior al último publicado. Sin tabla
 * todavía (migración sin aplicar) o con error: ninguno, y se ve lo publicado.
 */
async function leerBorrador(accountId: string): Promise<unknown> {
  try {
    const filas = await db.execute<{ snapshot: unknown }>(sql`
      select v.snapshot
      from website_config_versions v
      where v.account_id = ${accountId}::bigint
        and v.published_at is null
        and v.created_at > coalesce(
          (select max(p.created_at) from website_config_versions p
            where p.account_id = ${accountId}::bigint and p.published_at is not null),
          '-infinity'::timestamptz)
      order by v.created_at desc, v.id desc
      limit 1`);
    return filas[0]?.snapshot ?? null;
  } catch (error) {
    console.error("Error leyendo el borrador de la web:", error);
    return null;
  }
}

function leerPublicada(accountId: string): Promise<SiteConfigRow | null> {
  return unstable_cache(
    () => leerFila(accountId),
    ["site-config", accountId, DESPLIEGUE],
    { tags: [siteConfigTag(accountId)], revalidate: REVALIDAR_CADA_S },
  )();
}

const leerConfig = cache(async (accountId: string): Promise<SiteConfigRow | null> => {
  if (accountId !== SITE_ACCOUNT_ID) return leerFila(accountId);
  if (await borradorDeLaPeticion()) {
    const [fila, snapshot] = await Promise.all([leerFila(accountId), leerBorrador(accountId)]);
    return mergeDraft(fila, snapshot);
  }
  return leerPublicada(accountId);
});

/** Sin argumento, la cuenta de este despliegue. Lanza si la base falla: cada getter tiene su valor por defecto. */
export function getSiteConfigRow(accountIdArg?: bigint | string): Promise<SiteConfigRow | null> {
  return leerConfig(String(accountIdArg ?? SITE_ACCOUNT_ID));
}
