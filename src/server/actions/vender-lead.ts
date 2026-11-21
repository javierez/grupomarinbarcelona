"use server";

import { eq } from "drizzle-orm";

import { env } from "~/env";
import { db } from "~/server/db";
import { notifications, users } from "~/server/db/schema";
import type { ContactLeadData } from "~/types/property-form";
import { isHoneypotFilled } from "~/lib/honeypot";
import { rateLimit, getClientIp } from "~/lib/rate-limit";
import { sendEmail } from "~/lib/email";
import { guardarPropietarioDeLaWeb } from "~/server/contacto-de-la-web";
import { errorDelTelefono } from "~/lib/identidad-de-contacto";
import { getAdminAgent } from "~/server/queries/agents";
import { getAccountBranding } from "~/server/queries/account-branding";
import { generateAgentLeadNotificationEmail } from "~/templates/emails/agent-lead-notification";

const emptyToNull = (value: string): string | null => (value === "" ? null : value);

/**
 * /vender corto (`features_props.venderFormulario = "corto"`, el de la v1):
 * solo nombre, teléfono y correo. Guarda al propietario en Captaciones
 * (`guardarPropietarioDeLaWeb`: el mismo contacto si ya estaba, con su agente
 * y en Leads si es nuevo) sin crear inmueble ni anuncio, avisa en el
 * CRM con enlace a su contacto y manda un correo al agente principal. El
 * agente llama y pide el resto.
 *
 * Copia de `submitVenderLead` de la v1 (server/actions/property-listing.ts).
 * La cuenta sale de la web (NEXT_PUBLIC_ACCOUNT_ID), nunca del que llama.
 */
export async function submitVenderLead(
  data: ContactLeadData,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (isHoneypotFilled(data.honeypot)) {
      return { success: true };
    }

    const ip = await getClientIp();
    const limit = rateLimit(`lead:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!limit.success) {
      return {
        success: false,
        error:
          "Demasiadas solicitudes. Por favor, inténtalo de nuevo en unos minutos.",
      };
    }

    const trimmedName = (data.nombre ?? "").trim().slice(0, 200);
    if (!trimmedName) {
      return { success: false, error: "El nombre es obligatorio." };
    }
    const email = emptyToNull((data.email ?? "").trim().slice(0, 200));
    // Sin recortar: un teléfono a medias es el de otra persona.
    const telefonoLargo = errorDelTelefono(data.telefono);
    if (telefonoLargo) return { success: false, error: telefonoLargo };
    const phone = emptyToNull((data.telefono ?? "").trim());
    if (!email && !phone) {
      return {
        success: false,
        error:
          "Indica al menos un email o teléfono para que podamos contactarte.",
      };
    }
    // El formulario no deja enviar sin la casilla; si llega sin ella, no se
    // apunta una aceptación que nadie ha dado.
    if (data.acceptTerms !== true) {
      return {
        success: false,
        error: "Debe aceptar los términos y condiciones",
      };
    }

    const [firstName, ...rest] = trimmedName.split(/\s+/);
    const lastName = rest.join(" ");
    const accountId = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

    // Quien ya estaba (un comprador que ahora vende) sigue siendo el mismo
    // contacto; uno nuevo entra con su agente y en Leads.
    const contactId = await guardarPropietarioDeLaWeb({
      accountId,
      firstName: firstName ?? trimmedName,
      lastName,
      email,
      phone,
      nota: "Lead generado vía formulario web (vender)",
      origen: "website_vender_form",
      terminosAceptados: true,
    });
    const ownerName = lastName ? `${firstName} ${lastName}` : trimmedName;

    sendAgentLeadEmail(accountId, { ownerName, ownerEmail: email, ownerPhone: phone }).catch(
      (err) => {
        console.error("Failed to send agent lead email:", err);
      },
    );

    db.insert(notifications)
      .values({
        accountId,
        userId: null,
        fromUserId: null,
        type: "new_website_listing",
        title: `Nueva captación web: ${ownerName}`,
        message: `${ownerName} ha enviado sus datos desde la web para vender una propiedad.`,
        category: "inbox",
        priority: "high",
        entityType: "contact",
        entityId: contactId,
        metadata: {
          ownerName,
          ownerEmail: email,
          ownerPhone: phone,
          source: "website_vender_form",
        },
        actionUrl: `/contactos/${contactId}`,
        deliveryChannel: "in_app",
        isDelivered: true,
        deliveredAt: new Date(),
        isActive: true,
      })
      .catch((err) => {
        console.error("Failed to create in-app notification:", err);
      });

    return { success: true };
  } catch (error) {
    console.error("Error submitting vender lead:", error);
    return {
      success: false,
      error:
        "Ha ocurrido un error al enviar el formulario. Por favor, inténtelo de nuevo.",
    };
  }
}

/** El correo `agent-lead-notification` al agente principal de la cuenta (el
 *  primer usuario con rol 3). Sin agente o sin correo, no se envía. */
async function sendAgentLeadEmail(
  accountId: bigint,
  params: { ownerName: string; ownerEmail: string | null; ownerPhone: string | null },
): Promise<void> {
  const agentId = await getAdminAgent();
  const [agent] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, agentId))
    .limit(1);

  if (!agent?.email) {
    console.warn("⚠️ Agent has no email, skipping lead notification");
    return;
  }

  const branding = await getAccountBranding(accountId);
  const emailContent = generateAgentLeadNotificationEmail({
    ownerName: params.ownerName,
    ownerEmail: params.ownerEmail,
    ownerPhone: params.ownerPhone,
    logoUrl: branding.logoUrl,
    agencyName: branding.agencyName,
  });

  await sendEmail({
    to: agent.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });
}
