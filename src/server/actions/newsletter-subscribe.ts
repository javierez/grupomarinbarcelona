"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { isHoneypotFilled } from "~/lib/honeypot";
import {
  subscriberConsent,
  type ConsentCategories,
} from "~/lib/newsletter-consent";
import { getClientIp, rateLimit } from "~/lib/rate-limit";
import { db } from "~/server/db";
import { contactActivity, contacts } from "~/server/db/schema";
import { resolveWebLeadAgent } from "~/server/lead-assignment";

const ACCOUNT_ID = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

const subscribeSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  honeypot: z.string().optional(),
});

export type NewsletterSubscribeData = z.infer<typeof subscribeSchema>;

/**
 * La caja «Suscríbete» del blog. Deja a la persona en los contactos de la
 * agencia con el permiso para comunicaciones comerciales apuntado: cuándo, por
 * dónde y desde qué IP. Es lo que el CRM exige para incluirla en una campaña.
 *
 * Si el correo ya es de un contacto, se le apunta el permiso a esa ficha: no
 * se crea otra.
 */
export async function subscribeToNewsletter(
  data: NewsletterSubscribeData,
): Promise<{ success: boolean; error?: string }> {
  try {
    // A un bot se le dice que sí para que no insista.
    if (isHoneypotFilled(data.honeypot)) return { success: true };

    const ip = await getClientIp();
    if (!rateLimit(`newsletter:${ip}`, { maxRequests: 5, windowMs: 60_000 }).success) {
      return {
        success: false,
        error: "Demasiados intentos. Prueba de nuevo en unos minutos.",
      };
    }

    const parsed = subscribeSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Revisa el nombre y el correo." };
    }
    const { name, email } = parsed.data;
    const now = new Date();
    const consentIp = ip === "unknown" ? null : ip.slice(0, 45);

    const [existing] = await db
      .select({
        contactId: contacts.contactId,
        status: contacts.gdprConsentStatus,
        categories: contacts.gdprConsentCategories,
      })
      .from(contacts)
      .where(
        and(
          eq(contacts.accountId, ACCOUNT_ID),
          sql`lower(${contacts.email}) = ${email}`,
        ),
      )
      .orderBy(asc(contacts.contactId))
      .limit(1);

    const consent = subscriberConsent({
      status: existing?.status ?? null,
      categories: (existing?.categories ?? null) as ConsentCategories | null,
    });
    // Se opuso al tratamiento de sus datos: la ficha no se toca desde aquí.
    if (!consent) return { success: true };

    const consentFields = {
      gdprConsent: true,
      gdprConsentStatus: consent.status,
      gdprConsentDate: now,
      gdprConsentMethod: "web",
      gdprConsentIp: consentIp,
      gdprConsentCategories: consent.categories,
    };

    let contactId: bigint;
    if (existing) {
      contactId = existing.contactId;
      await db
        .update(contacts)
        .set({ ...consentFields, updatedAt: now })
        .where(
          and(
            eq(contacts.contactId, contactId),
            eq(contacts.accountId, ACCOUNT_ID),
          ),
        );
    } else {
      const [firstName = name, ...rest] = name.split(/\s+/);
      const [created] = await db
        .insert(contacts)
        .values({
          accountId: ACCOUNT_ID,
          firstName: firstName.slice(0, 100),
          lastName: rest.join(" ").slice(0, 100),
          email,
          source: "Website",
          // Mismas reglas de reparto que cualquier otro contacto de la web.
          assignedTo: await resolveWebLeadAgent({ accountId: ACCOUNT_ID }),
          additionalInfo: {
            source: "website_newsletter",
            firstContactDate: now.toISOString(),
          },
          isActive: true,
          ...consentFields,
        })
        .returning({ contactId: contacts.contactId });
      contactId = created!.contactId;
    }

    // La misma línea que deja el CRM en la ficha cuando alguien acepta.
    await db.insert(contactActivity).values({
      contactId,
      userId: "system",
      action: "consent_given",
      details: {
        status: consent.status,
        categories: consent.categories,
        method: "web",
        ip: consentIp,
        timestamp: now.toISOString(),
        accountId: ACCOUNT_ID.toString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return {
      success: false,
      error: "No hemos podido apuntarte. Inténtalo de nuevo.",
    };
  }
}
