import { and, desc, eq, sql, type AnyColumn, type SQL } from "drizzle-orm";

import { db } from "./db";
import { contacts } from "~/server/db/schema";

/**
 * «¿Ya tenemos a esta persona?» para los formularios de la web.
 *
 * Réplica deliberada de `findExistingContact` del CRM
 * (`vesta/src/server/queries/contact-lookup.ts`): los dos repos escriben en la
 * MISMA tabla `contacts` y el CRM no es importable desde aquí. Mismo orden,
 * correo y después teléfono, y el teléfono se compara por el final contra el
 * principal Y el secundario, en cualquier formato guardado.
 *
 * Antes cada formulario comparaba la cadena exacta y solo el teléfono
 * principal: quien ya estaba en el CRM con ese número como secundario, o
 * guardado con «+34», entraba como un contacto nuevo.
 */

/** Los dígitos del número sin prefijo de país: «+34 600 11 22 33» → «600112233». */
export function localPhoneDigits(phone: string | null | undefined): string {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length > 9 && digits.startsWith("34")) digits = digits.slice(2);
  return digits;
}

const digitsOf = (column: AnyColumn) =>
  sql`REGEXP_REPLACE(COALESCE(${column}, ''), '\\D', '', 'g')`;

async function first(accountId: bigint, match: SQL) {
  const [row] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.accountId, accountId), match))
    // La activa antes que la borrada.
    .orderBy(desc(contacts.isActive), sql`${contacts.contactId} + 0`)
    .limit(1);
  return row ?? null;
}

export async function findExistingContact(
  accountId: bigint,
  who: { email?: string | null; phone?: string | null },
) {
  const email = who.email?.trim().toLowerCase();
  if (email) {
    const found = await first(
      accountId,
      sql`LOWER(TRIM(${contacts.email})) = ${email}`,
    );
    if (found) return found;
  }

  const local = localPhoneDigits(who.phone);
  if (local.length >= 6) {
    const tail = `%${local}`;
    return first(
      accountId,
      sql`(${digitsOf(contacts.phone)} LIKE ${tail} OR ${digitsOf(contacts.secondaryPhone)} LIKE ${tail})`,
    );
  }
  return null;
}
