// Hardcoded overrides for account 155 (GO4 Asturias Inmobiliaria).
// Lives in code (not DB) so admin UI edits to website_config can't wipe it.

export const ACCOUNT_155_ID = "155";

/**
 * True when we are rendering for this account.
 *
 * `accountId` is only passed by the CRM preview, which renders an ARBITRARY
 * account from this one deployment. Omitted everywhere else, where the
 * deployment's own env var is the right answer.
 */
export function isAccount155(accountId?: bigint | string): boolean {
  const id = accountId?.toString() ?? process.env.NEXT_PUBLIC_ACCOUNT_ID;
  return id === ACCOUNT_155_ID;
}

// 155 wants "Propiedades destacadas" to work as a teaser: a short grid plus a
// "Ver más" button that opens the full-screen vertical property feed (TikTok
// style) instead of navigating to the search-results page. Forced in code so
// admin UI edits to website_config can't wipe it. See getFeaturesProps().
export const ACCOUNT_155_FEATURED_MODE = "feed";

// How many cards the teaser grid shows before the "Ver más" button — 3 fills
// exactly one row at lg:grid-cols-3.
export const ACCOUNT_155_FEATURED_GRID_COUNT = 3;

// 155 leans hard on short-form video, so the vertical property feed gets its own
// navbar entry instead of being buried behind the search-results view toggle.
// Rendered as a highlighted pill (not a plain nav link) so it reads as the
// distinct browsing mode it is. Points at the existing `?vista=feed` route, so
// there is no extra data plumbing — the search page already renders the feed.
export const ACCOUNT_155_FEED_NAV_LABEL = "Descubre";
export const ACCOUNT_155_FEED_NAV_HREF =
  "/venta-propiedades/todas-ubicaciones?vista=feed";

// BetterPlace instant property-valuation widget, under Guillermo's profile.
// Despite the vendor calling it "public-ratings", it renders a VALUATION form
// (`valorar` = appraise, not review), so it belongs on /vender next to the
// listing form. `iframe=true` is required — without it the URL serves the full
// page instead of the embeddable view.
export const ACCOUNT_155_BETTERPLACE_RATINGS_URL =
  "https://betterplaceapp.com/valorar/guillermo-ortigueira/u/56518?locale=es&iframe=true";
