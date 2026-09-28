// Hardcoded content overrides for account 141 (Grupo Marín).
// Lives in code (not DB) so admin UI edits to website_config can't wipe it.

export const ACCOUNT_141_ID = "141";

/**
 * True when we are rendering for this account.
 *
 * `accountId` is only passed by the CRM preview, which renders an ARBITRARY
 * account from this one deployment. Omitted everywhere else, where the
 * deployment's own env var is the right answer.
 */
export function isAccount141(accountId?: bigint | string): boolean {
  const id = accountId?.toString() ?? process.env.NEXT_PUBLIC_ACCOUNT_ID;
  return id === ACCOUNT_141_ID;
}

// "Lo que nos diferencia" section — Grupo Marín's reform/construction
// differentiators. Rendered on the homepage by <DifferentiatorsSection />.
// `lead` is emphasised (bold); `text` continues the sentence in muted colour.
export const ACCOUNT_141_DIFFERENTIATORS = {
  eyebrow: "Por qué Grupo Marín",
  title: "Lo que nos diferencia",
  subtitle:
    "No somos una constructora más. Nuestra filosofía se basa en escucharte y adaptarnos a ti.",
  items: [
    {
      icon: "badge-euro",
      lead: "Mejoramos cualquier presupuesto",
      text: "de la competencia. Así de fácil.",
    },
    {
      icon: "credit-card",
      lead: "Financiamos tu reforma.",
      text: "Págala a cómodos plazos cada mes.",
    },
    {
      icon: "shield-check",
      lead: "Te descontamos hasta 80 € al día",
      text: "sobre el precio pactado si no cumplimos, por incidencias, el plazo de entrega acordado.",
    },
    {
      icon: "zap",
      lead: "Disponibilidad para empezar ya",
      text: "tu reforma de forma inmediata.",
    },
  ],
} as const;
