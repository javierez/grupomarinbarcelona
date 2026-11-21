/**
 * Lo que guarda un formulario de la web con la casilla obligatoria «Acepto los
 * términos y condiciones … y la política de privacidad» marcada (/vender, el
 * completo y el corto): cuándo se aceptaron, dentro de `additionalInfo`.
 *
 * No toca los campos RGPD (`gdpr_consent_*`): el contacto se queda en
 * `not_asked`, el valor por defecto de la base, como el de la consulta de una
 * ficha y el del formulario de contacto. La casilla acepta términos y
 * privacidad, no comunicaciones comerciales, y en el CRM un «accepted» es un
 * sí a todo: sin categorías vale para todas (`hasGdprConsentForCategory`) y la
 * agencia ya no puede pedirlo (`consentRequestBlockReason` → "already_consented").
 * La v1 guardaba «accepted» con las cuatro categorías, comerciales incluidas.
 */
export function webFormTermsAccepted(now: Date): { termsAcceptedAt: string } {
  return { termsAcceptedAt: now.toISOString() };
}
