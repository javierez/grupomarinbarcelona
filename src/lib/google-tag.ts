/**
 * Work out what an agency actually pasted into the "Google Analytics" box.
 *
 * The field asks for a measurement id, but nobody has one on hand — what people
 * have is the block Google hands them, so what arrives is any of:
 *
 *   G-7YRQKT91SK
 *   g-7yrqkt91sk
 *   GTM-ABC1234
 *   <!-- Google tag (gtag.js) -->
 *   <script async src="https://www.googletagmanager.com/gtag/js?id=G-7YRQKT91SK"></script>
 *   https://www.googletagmanager.com/gtag/js?id=G-7YRQKT91SK
 *   UA-123456-1            ← dead since July 2023, deliberately rejected
 *
 * Rejecting everything but the bare id is how this silently failed before, so
 * the id is dug out of whatever came in. Only ever an id: the value ends up in
 * a <script> tag, and the same admin panel has a free custom-scripts box, so
 * nothing is echoed through verbatim.
 */

export type GoogleTagKind = "ga4" | "gtm";

export interface GoogleTag {
  /** Canonical, upper-cased id: "G-XXXXXXX" or "GTM-XXXXXXX". */
  id: string;
  kind: GoogleTagKind;
}

// GTM first: "GTM-ABC" also ends in a G-…-shaped tail, so testing G- first
// would happily match the wrong half of a container id.
const PATTERNS: { kind: GoogleTagKind; re: RegExp }[] = [
  { kind: "gtm", re: /\bGTM-[A-Z0-9]{4,}\b/i },
  { kind: "ga4", re: /\bG-[A-Z0-9]{4,}\b/i },
];

/**
 * Pull the tag id out of anything an agency might paste. Returns null when
 * there is nothing usable — including a GA3/Universal "UA-" id, which Google
 * turned off in July 2023 and which `gtag/js` will not load.
 */
export function parseGoogleTag(raw: string | null | undefined): GoogleTag | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;

  for (const { kind, re } of PATTERNS) {
    const match = re.exec(value);
    if (match) return { id: match[0].toUpperCase(), kind };
  }
  return null;
}

/** True when the input holds a dead Universal Analytics id and nothing newer. */
export function isLegacyUniversalId(raw: string | null | undefined): boolean {
  if (typeof raw !== "string") return false;
  return parseGoogleTag(raw) === null && /\bUA-\d{4,}-\d+\b/i.test(raw);
}
