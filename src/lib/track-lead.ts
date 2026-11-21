// Avisa a los píxeles de anuncios de que ha entrado un lead. Si el píxel no se
// ha cargado (sin consentimiento o la agencia no lo tiene), no hace nada.
type Oaiq = (...args: unknown[]) => void;

export function trackLeadCreated(): void {
  if (typeof window === "undefined") return;
  const oaiq = (window as unknown as { oaiq?: Oaiq }).oaiq;
  try {
    oaiq?.("measure", "lead_created", { type: "customer_action" });
  } catch {
    // Un píxel roto nunca debe romper el envío del formulario.
  }
}
