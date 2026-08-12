/**
 * Presentation helpers shared by the blog index, cards and article page.
 * Client-safe: no DB, no server-only imports.
 */

const LONG_DATE = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const SHORT_DATE = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** "12 de marzo de 2026" — used on the article page. */
export function formatPostDate(date: Date | null): string {
  if (!date) return "";
  return LONG_DATE.format(date);
}

/** "12 mar 2026" — used in the meta line of cards, where space is tight. */
export function formatPostDateShort(date: Date | null): string {
  if (!date) return "";
  return SHORT_DATE.format(date).replace(/\./g, "");
}

/** ISO date for <time dateTime> and JSON-LD. */
export function isoDate(date: Date | null): string | undefined {
  return date ? date.toISOString() : undefined;
}

export function readTimeLabel(minutes: number): string {
  return `${minutes} min de lectura`;
}

/**
 * Slugify a title the same way the editor does, so a slug typed in the CRM and
 * one generated here always agree.
 */
export function slugifyTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
