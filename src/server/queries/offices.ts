import "server-only";
import { cache } from "react";
import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { offices } from "~/server/db/schema";
import { env } from "~/env";
import { countListings } from "~/server/queries/listings";
import {
  ACCOUNT_141_OFFICE_ORDER,
  catchmentFor,
  photoFor,
  type OfficePhoto,
} from "~/lib/account-overrides/141-oficinas";
import { normalizeForUrl } from "~/lib/utils";

const ACCOUNT_ID = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

export type OfficeCard = {
  officeId: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  /** URL slug, derived from the office city. */
  slug: string;
  /** Towns this office covers (may be empty if none configured). */
  cities: readonly string[];
  /** Live count of published listings across those towns. */
  listingCount: number;
  /** Link into the existing search page, pre-filtered to the catchment. */
  href: string;
  mapUrl: string;
  /** Town photo + its CC attribution, or null if none configured. */
  photo: OfficePhoto | null;
};

/**
 * Active offices for the current account, each with a live listing count.
 *
 * Counts come from the town catchment rather than `listings.office_id`, which
 * is ~95 % empty for account 141 — see ~/lib/account-overrides/141-oficinas.
 */
export const getOfficeCards = cache(
  async (accountIdArg?: bigint): Promise<OfficeCard[]> => {
  const rows = await db
    .select()
    .from(offices)
    .where(
      and(
        eq(offices.accountId, accountIdArg ?? ACCOUNT_ID),
        eq(offices.isActive, true),
      ),
    );

  const cards = await Promise.all(
    rows.map(async (o): Promise<OfficeCard> => {
      const cities = catchmentFor(o.city);
      // No catchment configured → don't claim a count we can't back up.
      const listingCount =
        cities.length > 0
          ? await countListings({ cities: cities.map((c) => normalizeForUrl(c)) })
          : 0;
      const citySlugs = Array.from(
        new Set(cities.map((c) => normalizeForUrl(c))),
      ).sort();
      const mapQuery = [o.address, o.city, o.state].filter(Boolean).join(", ");

      return {
        officeId: o.officeId.toString(),
        name: o.name,
        address: o.address,
        city: o.city,
        state: o.state,
        postalCode: o.postalCode,
        phone: o.phone,
        email: o.email,
        slug: normalizeForUrl(o.city ?? o.name),
        cities,
        listingCount,
        href:
          citySlugs.length > 0
            ? `/venta-propiedades/en-${citySlugs.join(",")}`
            : "/venta-propiedades/todas-ubicaciones",
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`,
        photo: photoFor(o.city),
      };
    }),
  );

  // Present them in the account's preferred order, unknown offices last.
  const order = ACCOUNT_141_OFFICE_ORDER as readonly string[];
  return cards.sort((a, b) => {
    const ai = order.indexOf(a.city ?? "");
    const bi = order.indexOf(b.city ?? "");
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
});
