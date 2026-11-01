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

// OpenAI (ChatGPT ads) pixel Marta sent on 31-oct-2026. Loads only after the
// visitor accepts cookies (LSSI 22.2), from <ConsentAnalytics />.
export const ACCOUNT_141_OPENAI_PIXEL_ID = "M8VeCKGdrPEHuk2tvM2gmr";

// Leads de la landing de anuncios (/anuncios): procedencia que pidió Marta y
// ella de captadora, como en sus hojas de GOEX (31-oct-2026).
export const ACCOUNT_141_LANDING_SOURCE = "Goex-Chatgpt";
export const ACCOUNT_141_MARTA_USER_ID = "13995c2f-2d94-4842-aae1-4898258d59ff";

// Copia de cada lead de /anuncios en la hoja de Marta «CRM gm- CHATGPT».
// Apps Script «Vesta - Landing Grupo Marin a hoja CRM gm- CHATGPT» en la cuenta
// de Google gonzalo@vesta-crm.com; añade una fila si la clave coincide. Solo se
// usa en el servidor (src/app/api/anuncios/lead/route.ts), nunca llega al
// navegador. Gonzalo eligió dejarla en el código (31-oct-2026).
export const ACCOUNT_141_LANDING_SHEET = {
  url: "https://script.google.com/macros/s/AKfycbzuIfDJ38mwi420Kkl5IhVVCCPFiyU0DHLrUACbUdvhIe-6SzWWIv7R15G5wzWWih4/exec",
  key: "6e086f0dd6d343329c5c319e608c2881",
} as const;

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
