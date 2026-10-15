import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { env } from "~/env";
import { inSyncTranslations } from "~/lib/site-languages";
import { db } from "../db";
import { listings } from "~/server/db/schema";

const ACCOUNT_ID = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

/**
 * Las traducciones de la descripción que el CRM ya tiene guardadas para este
 * anuncio y que siguen al día: `{ lang: text }`. Aquí no se traduce nada.
 *
 * `description` es el castellano que enseña la ficha. El CRM guarda con cada
 * traducción el SHA-256 del texto del que salió (sin blancos en los bordes),
 * así que una descripción editada después deja de tener traducción hasta que
 * el CRM la rehace.
 */
export const getDescriptionTranslations = cache(
  async (
    listingId: bigint,
    description: string | null | undefined,
  ): Promise<Record<string, string>> => {
    const source = description?.trim();
    if (!source) return {};
    try {
      const [row] = await db
        .select({ translations: listings.descriptionTranslations })
        .from(listings)
        .where(
          and(
            eq(listings.listingId, listingId),
            eq(listings.accountId, ACCOUNT_ID),
          ),
        )
        .limit(1);
      return inSyncTranslations(
        row?.translations,
        createHash("sha256").update(source).digest("hex"),
      );
    } catch (error) {
      console.error("Error fetching description translations:", error);
      return {};
    }
  },
);
