// Hardcoded brand overrides for account 139 (Domus Aurea Capital).
// Lives in code (not DB) so admin UI edits to website_config can't wipe it.

export const ACCOUNT_139_ID = "139";

/**
 * True when we are rendering for this account.
 *
 * `accountId` is only passed by the CRM preview, which renders an ARBITRARY
 * account from this one deployment. Omitted everywhere else, where the
 * deployment's own env var is the right answer.
 */
export function isAccount139(accountId?: bigint | string): boolean {
  const id = accountId?.toString() ?? process.env.NEXT_PUBLIC_ACCOUNT_ID;
  return id === ACCOUNT_139_ID;
}

// 139's brand (secondary) colour is a light taupe (#CBC3BB). The automatic
// contrast picker would put dark text on it, but the brand wants WHITE text on
// every brand/secondary-coloured label, badge and button. When set, layout
// forces `--brand-foreground` to white instead of the auto-computed value.
export const ACCOUNT_139_WHITE_BRAND_FOREGROUND = true;

// Keeps the DB secondaryColor (#CBC3BB) but lays a very subtle dark tint over
// it — like a low-opacity black overlay — so the white text stands out a bit
// more without changing the configured colour. 0 = unchanged, 1 = black.
export const ACCOUNT_139_BRAND_DARKEN = 0.18;

// 139 wants every description/paragraph block justified (property descriptions,
// the "Sobre nosotros" body, service-card copy, etc.). Forced in code so admin
// UI edits to website_config can't wipe it. See getFeaturesProps().
export const ACCOUNT_139_DESCRIPTION_ALIGN = "justify";

// Tighter vertical rhythm on the home page — less air between sections and
// paragraphs than the default `py-24 sm:py-28 lg:py-32`.
export const ACCOUNT_139_SECTION_PADDING = "py-12 sm:py-16 lg:py-20";
