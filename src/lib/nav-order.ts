/**
 * The order of the navbar entries, as configured from the CRM.
 *
 * `features_props.navOrder` is a list of entry keys ("venta", "alquiler", …).
 * Unset — which is every account that has never opened the Navegación tab —
 * means "keep the order this template ships with", so nothing moves until
 * somebody drags something.
 *
 * The same file exists in `vestawebpage` (v1) and, for the CRM's own preview of
 * the bar, in `vesta/src/lib/website-preview/nav-items.ts`. The three repos
 * share no code, so a new entry key has to be added in all of them.
 */

/** Keys this template knows how to draw. Others in `navOrder` are ignored. */
export type NavItemKey =
  | "venta"
  | "promociones"
  | "inversion"
  | "alquiler"
  | "vender"
  | "nosotros"
  | "servicios"
  | "blog"
  | "contacto"
  // "Enlaces de interés": always on in v1, opt-in here (`enlacesInNav`).
  | "enlaces"
  // Per-account entry. The CRM doesn't list it, which is exactly why the rule
  // below has to keep an unlisted entry where it was.
  | "reformas"
  // A link the agency added (`features_props.navExtra`): "extra:<href>".
  | `extra:${string}`;

/**
 * Reorders entries by a saved order.
 *
 * An entry the saved order never mentions stays put: it renders immediately
 * after whichever of the entries before it *is* listed. Sweeping it to the end
 * instead would have moved account 141's "Reformas" — first in its bar — to the
 * far right the moment anybody touched the order of anything else.
 *
 * An added link the order doesn't mention yet goes last instead: it was never
 * anywhere, and last is where the agency just saw it appear.
 */
export function applyNavOrder<T extends { key: NavItemKey }>(
  items: T[],
  navOrder: string[] | undefined,
): T[] {
  if (!navOrder?.length) return items;
  const rankOf = new Map(navOrder.map((key, index) => [key, index]));
  let previousRank = -1;
  return items
    .map((item, index) => {
      const explicit = rankOf.get(item.key);
      if (explicit !== undefined) {
        previousRank = explicit;
        return { item, rank: explicit, unlisted: 0, index };
      }
      const rank = item.key.startsWith("extra:") ? navOrder.length : previousRank;
      return { item, rank, unlisted: 1, index };
    })
    .sort(
      (a, b) => a.rank - b.rank || a.unlisted - b.unlisted || a.index - b.index,
    )
    .map((entry) => entry.item);
}
