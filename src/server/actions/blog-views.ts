"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { blogPosts } from "~/server/db/schema";
import { env } from "~/env";

const ACCOUNT_ID = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

const slugSchema = z.string().min(1).max(255);

/**
 * Suma una lectura al artículo y devuelve el total ya actualizado.
 *
 * Se llama desde el navegador con el artículo ya pintado, no durante el render:
 * la página va con ISR de cinco minutos, así que contar en el servidor sumaría
 * una lectura por regeneración en vez de una por visita. Al exigir JavaScript,
 * además, los rastreadores que no lo ejecutan no inflan la cifra.
 *
 * El incremento va en el propio UPDATE (`view_count + 1`), no leyendo y
 * escribiendo: dos visitas a la vez se pisarían la una a la otra.
 *
 * Filtra por cuenta y por estado publicado: un slug de otra agencia, o un
 * borrador, no puede tocar el contador. Devuelve null cuando no hay fila, y el
 * componente simplemente no enseña nada.
 */
export async function registerBlogView(slug: string): Promise<number | null> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return null;

  try {
    const [row] = await db
      .update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(
        and(
          eq(blogPosts.accountId, ACCOUNT_ID),
          eq(blogPosts.slug, parsed.data),
          eq(blogPosts.status, "published"),
        ),
      )
      .returning({ viewCount: blogPosts.viewCount });

    return row?.viewCount ?? null;
  } catch (error) {
    console.error("Error registering blog view:", error);
    return null;
  }
}
