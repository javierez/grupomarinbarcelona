import "server-only";
import { and, eq, or, sql, type SQL } from "drizzle-orm";

import { db } from "./db";
import { contacts } from "~/server/db/schema";
import { resolveWebLeadAgent } from "./lead-assignment";
import { correoParaBuscar, patronesDelTelefono } from "~/lib/identidad-de-contacto";
import { cambiosDelPropietario } from "~/lib/propietario-de-la-web";
import { webFormTermsAccepted } from "~/lib/web-form-consent";

/** El correo como lo indexa el CRM (idx_contacts_account_email_norm). */
function porCorreo(email: string | null | undefined): SQL | undefined {
  const correo = correoParaBuscar(email);
  return correo ? sql`LOWER(TRIM(${contacts.email})) = ${correo}` : undefined;
}

/**
 * El principal o el secundario, sin espacios, guiones, paréntesis ni «+»: la
 * expresión de idx_contacts_phone_trgm e idx_contacts_secondary_phone_trgm
 * (`phoneLike` del CRM). Cambiarla deja la búsqueda sin índice.
 */
function porTelefono(phone: string | null | undefined): SQL | undefined {
  const patrones = patronesDelTelefono(phone);
  if (patrones.length === 0) return undefined;
  return or(
    ...[contacts.phone, contacts.secondaryPhone].flatMap((col) =>
      patrones.map(
        (p) =>
          sql`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${col}, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '') LIKE ${p}`,
      ),
    ),
  );
}

/**
 * ¿Ya está en el CRM quien escribe desde la web? Como `findExistingContact`
 * del CRM: primero por el correo, luego por cualquiera de sus dos teléfonos,
 * solo entre las fichas activas de la cuenta. Una sola pregunta para todos los
 * formularios de la web (contacto, consulta de una ficha, /vender, la landing
 * de 141 y los bloques de las páginas propias).
 */
export async function contactoDeLaWeb(
  accountId: bigint,
  quien: { email?: string | null; phone?: string | null },
) {
  for (const match of [porCorreo(quien.email), porTelefono(quien.phone)]) {
    if (!match) continue;
    const [contacto] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.accountId, accountId), eq(contacts.isActive, true), match))
      // `+ 0` a propósito, como en el CRM: con `ORDER BY contact_id` Postgres
      // recorre la clave primaria de todas las cuentas en vez del índice.
      .orderBy(sql`${contacts.contactId} + 0`)
      .limit(1);
    if (contacto) return contacto;
  }
  return null;
}

/**
 * El propietario que quiere vender desde la web. Si ya estaba, el mismo
 * contacto con lo que faltaba (`cambiosDelPropietario`); si no, uno nuevo en
 * Captaciones y en Leads, con el agente que le toca por el reparto de la
 * cuenta, como el del formulario de contacto. Devuelve su id.
 */
export async function guardarPropietarioDeLaWeb(p: {
  accountId: bigint;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nota: string;
  /** `additionalInfo.source` del contacto nuevo («website_vender_form»). */
  origen?: string;
  terminosAceptados: boolean;
}): Promise<bigint> {
  const ahora = new Date();
  const ya = await contactoDeLaWeb(p.accountId, p);
  if (ya) {
    await db
      .update(contacts)
      .set(cambiosDelPropietario(ya, p, ahora))
      .where(and(eq(contacts.contactId, ya.contactId), eq(contacts.accountId, p.accountId)));
    return ya.contactId;
  }

  const [nuevo] = await db
    .insert(contacts)
    .values({
      accountId: p.accountId,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      phone: p.phone,
      source: "Website",
      assignedTo: await resolveWebLeadAgent({ accountId: p.accountId }),
      isActive: true,
      // Sin esto no sale en Leads (por defecto es false).
      newLead: true,
      captacionStatus: "pendiente",
      captacionStatusUpdatedAt: ahora,
      // Objeto, no cadena: el CRM no lee una cadena. El RGPD se queda en
      // `not_asked` (ver `webFormTermsAccepted`).
      additionalInfo: {
        notes: p.nota,
        ...(p.origen ? { source: p.origen } : {}),
        firstContactDate: ahora.toISOString(),
        ...(p.terminosAceptados ? webFormTermsAccepted(ahora) : {}),
      },
    })
    .returning({ contactId: contacts.contactId });
  if (!nuevo) throw new Error("No se pudo crear el contacto");
  return nuevo.contactId;
}
