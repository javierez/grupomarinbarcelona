/**
 * Qué permiso queda apuntado cuando alguien se suscribe a las novedades desde
 * la web. Puro: lo usa la action de la caja «Suscríbete» y su test.
 *
 * Suscribirse es un sí a UNA cosa, las comunicaciones comerciales. Lo demás
 * que esa persona hubiera decidido antes no se toca.
 */

export type ConsentCategories = Record<
  | "property_notifications"
  | "commercial_communications"
  | "appointment_reminders"
  | "document_notifications",
  boolean
>;

export interface SubscriberConsent {
  status: "accepted";
  /** `null`: sin casillas, como un lead de portal. El CRM lo lee como un sí. */
  categories: ConsentCategories | null;
}

/**
 * `null`: no se toca la ficha. Pasa con quien se opuso al tratamiento de sus
 * datos (`restricted`): eso lo levanta la agencia, no un formulario.
 */
export function subscriberConsent(previous: {
  status: string | null;
  categories: ConsentCategories | null;
}): SubscriberConsent | null {
  if (previous.status === "restricted") return null;
  if (previous.categories) {
    return {
      status: "accepted",
      categories: { ...previous.categories, commercial_communications: true },
    };
  }
  // Dijo que no a todo antes de que hubiera casillas: su no a lo demás sigue.
  if (previous.status === "rejected" || previous.status === "withdrawn") {
    return {
      status: "accepted",
      categories: {
        property_notifications: false,
        commercial_communications: true,
        appointment_reminders: false,
        document_notifications: false,
      },
    };
  }
  return { status: "accepted", categories: null };
}
