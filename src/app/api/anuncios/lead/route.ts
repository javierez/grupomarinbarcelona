import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "~/server/db";
import { contacts, notifications } from "~/server/db/schema";
import { env } from "~/env";
import {
  ACCOUNT_141_LANDING_SHEET,
  ACCOUNT_141_LANDING_SOURCE,
  ACCOUNT_141_MARTA_USER_ID,
  isAccount141,
} from "~/lib/account-overrides/141";
import { rateLimit, getClientIp } from "~/lib/rate-limit";
import { resolveWebLeadAgent } from "~/server/lead-assignment";

// Recibe el formulario de la landing de anuncios (/anuncios) de Grupo Marín
// y lo mete en Vesta como contacto con procedencia «Goex-Chatgpt» y Marta de
// captadora, para medir lo que trae la campaña de ChatGPT. El JSON es el que
// arma el script de la landing.
const SOURCE = ACCOUNT_141_LANDING_SOURCE;
// Son propietarios que quieren vender: entran en la columna «pendiente» de
// Captaciones, como los leads de captación de GOEX.
const CAPTACION_PENDIENTE = "pendiente";

const optional = z
  .string()
  .max(500)
  .optional()
  .transform((v) => v?.trim() || undefined);

const leadSchema = z.object({
  nombre: z.string().trim().min(1).max(200),
  telefono: z.string().trim().min(9).max(30),
  email: optional,
  ubicacion: z.string().trim().min(1).max(300),
  publicado: optional,
  precio: optional,
  exclusiva: optional,
  mensaje: z.string().max(5000).optional(),
  utm_source: optional,
  utm_medium: optional,
  utm_campaign: optional,
  utm_content: optional,
  utm_term: optional,
  gclid: optional,
  fbclid: optional,
  pagina: optional,
});

/**
 * Copia el lead en la hoja de Marta. Nunca tumba el envío: el lead ya está en
 * Vesta, así que un fallo de Google solo se apunta en el log.
 */
async function copyToSheet(d: z.infer<typeof leadSchema>): Promise<void> {
  try {
    const res = await fetch(ACCOUNT_141_LANDING_SHEET.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: ACCOUNT_141_LANDING_SHEET.key, ...d }),
      signal: AbortSignal.timeout(10_000),
    });
    const text = (await res.text()).trim();
    if (text !== "ok") {
      console.error(
        "[anuncios] Sheet copy refused:",
        res.status,
        text.slice(0, 120),
      );
    }
  } catch (error) {
    console.error("[anuncios] Sheet copy failed:", error);
  }
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!isAccount141()) return json({ error: "Not found" }, 404);

  const ip = await getClientIp();
  if (
    !rateLimit(`anuncios:${ip}`, { maxRequests: 5, windowMs: 60_000 }).success
  ) {
    return json({ error: "Demasiadas solicitudes" }, 429);
  }

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "Datos inválidos" }, 400);
  const d = parsed.data;

  try {
    const accountId = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);
    const [firstName = "", ...rest] = d.nombre.split(/\s+/);
    const details = [
      `Ubicación: ${d.ubicacion}`,
      d.publicado && `¿Publicada en portales?: ${d.publicado}`,
      d.precio && `Precio que cree que pagarían: ${d.precio} €`,
      d.exclusiva && `¿Exclusiva?: ${d.exclusiva}`,
      d.mensaje?.trim() && `Mensaje: ${d.mensaje.trim()}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const note = `[${new Date().toLocaleDateString("es-ES")}] Landing de anuncios (ChatGPT) · ${details}`;
    const campaign = {
      utm_source: d.utm_source,
      utm_medium: d.utm_medium,
      utm_campaign: d.utm_campaign,
      utm_content: d.utm_content,
      utm_term: d.utm_term,
      gclid: d.gclid,
      fbclid: d.fbclid,
      pagina: d.pagina,
    };

    const [existing] = await db
      .select()
      .from(contacts)
      .where(
        and(eq(contacts.accountId, accountId), eq(contacts.phone, d.telefono)),
      )
      .limit(1);

    let contactId: bigint;
    if (existing) {
      contactId = existing.contactId;
      const info = (existing.additionalInfo ?? {}) as Record<string, unknown>;
      const notes = typeof info.notes === "string" ? info.notes : "";
      await db
        .update(contacts)
        .set({
          updatedAt: new Date(),
          ...(existing.source ? {} : { source: SOURCE }),
          ...(existing.captadorId
            ? {}
            : { captadorId: ACCOUNT_141_MARTA_USER_ID }),
          ...(existing.captacionStatus
            ? {}
            : {
                captacionStatus: CAPTACION_PENDIENTE,
                captacionStatusUpdatedAt: new Date(),
              }),
          ...(d.email && !existing.email ? { email: d.email } : {}),
          additionalInfo: {
            ...info,
            notes: notes ? `${notes}\n${note}` : note,
            lastWebContact: new Date().toISOString(),
            landingAnuncios: campaign,
          },
        })
        .where(eq(contacts.contactId, contactId));
    } else {
      const [created] = await db
        .insert(contacts)
        .values({
          accountId,
          firstName,
          lastName: rest.join(" "),
          email: d.email ?? null,
          phone: d.telefono,
          source: SOURCE,
          assignedTo: await resolveWebLeadAgent({ accountId }),
          captadorId: ACCOUNT_141_MARTA_USER_ID,
          captacionStatus: CAPTACION_PENDIENTE,
          captacionStatusUpdatedAt: new Date(),
          additionalInfo: {
            source: "landing_anuncios",
            firstContactDate: new Date().toISOString(),
            notes: note,
            landingAnuncios: campaign,
          },
          isActive: true,
        })
        .returning({ contactId: contacts.contactId });
      contactId = created!.contactId;
    }

    await db.insert(notifications).values({
      accountId,
      userId: null,
      fromUserId: null,
      type: "website_inquiry",
      title: `Nuevo lead de la landing de anuncios: ${d.nombre}`,
      message: details,
      category: "contacts",
      priority: "high",
      entityType: "contact",
      entityId: contactId,
      metadata: { source: "landing_anuncios", campaign },
      actionUrl: `/contactos/${contactId}`,
      deliveryChannel: "in_app",
      isDelivered: true,
      deliveredAt: new Date(),
      isActive: true,
    });

    await copyToSheet(d);
    return json({ success: true });
  } catch (error) {
    console.error("[anuncios] Lead failed:", error);
    return json({ error: "No se ha podido guardar" }, 500);
  }
}
