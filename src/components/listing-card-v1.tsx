import type { ReactNode } from "react";
import { Building, MapPin } from "lucide-react";
import { CardContent } from "~/components/ui/card";
import { getBankOwnedLabel } from "~/lib/data";
import type { ListingCardData } from "~/server/queries/listings";

/**
 * The v1 card's pieces, for `features_props.aspectoV1` (docs/v1-a-v2.md §3):
 * `PropertyCard` keeps the photo, the watermark fallback, the hover video and
 * the Vendido / Reservado overlays, and swaps in these labels and this body.
 * Copied from vestawebpage `listing-card.tsx`. v1's badge base is written out
 * because v2's `Badge` is uppercase with wide tracking.
 */
const V1_BADGE =
  "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 font-semibold";

/** Card shell: v1's shadcn card, a shadow on hover. */
export const V1_CARD_CLASS =
  "flex h-full flex-col overflow-hidden transition-all hover:shadow-lg";

export function ListingCardV1Badges({
  listing,
  typeLabel,
  operation,
  terminal,
}: {
  listing: ListingCardData;
  typeLabel: string;
  /** «En Venta» / «Venta»…, as the v2 card works it out. */
  operation: string;
  /** Vendido / Alquilado: the centre overlay takes over, no operation label. */
  terminal: boolean;
}) {
  return (
    <>
      <span className={`${V1_BADGE} absolute left-2 top-2 z-10 bg-white/80 text-sm text-foreground`}>
        {typeLabel}
      </span>
      {!terminal && (
        <span className={`${V1_BADGE} absolute right-2 top-2 z-10 border-0 bg-slate-900/55 text-sm text-white shadow-sm backdrop-blur-md`}>
          {operation}
        </span>
      )}
      {/* Bottom centre: the flags, stacked. */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
        {!!listing.isBankOwned && (
          <span className={`${V1_BADGE} border-0 bg-amber-50/80 px-3 py-1 text-xs text-amber-800 shadow-md backdrop-blur-sm`}>
            {getBankOwnedLabel(listing.propertyType)}
          </span>
        )}
        {!!listing.isFeatured && (
          <span className={`${V1_BADGE} border-0 bg-yellow-50/90 px-3 py-1 text-xs text-yellow-800 shadow-md backdrop-blur-sm`}>
            Destacado
          </span>
        )}
        {!!listing.isOportunidad && (
          <span className={`${V1_BADGE} border-0 bg-orange-50/90 px-3 py-1 text-xs text-orange-800 shadow-md backdrop-blur-sm`}>
            Oportunidad
          </span>
        )}
      </div>
    </>
  );
}

/** Title and price on one line, location, description, stats, reference. */
export function ListingCardV1Body({
  heading,
  headingIsLocation,
  price,
  location,
  description,
  stats,
  reference,
}: {
  /** null: `cardTitle: "none"`. */
  heading: string | null;
  headingIsLocation: boolean;
  /** null: the price is hidden. */
  price: ReactNode;
  /** null: no location row. */
  location: string | null;
  /** null: `showDescription` off. */
  description: string | null;
  /** null: no rooms, baths or area. */
  stats: ReactNode;
  /** null: `showReference` off. */
  reference: string | null;
}) {
  return (
    <CardContent className="flex flex-1 flex-col p-3">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="min-w-0 max-w-[60%] flex-1">
          {heading !== null && (
            <h3 className="flex items-center gap-1 truncate text-base font-semibold">
              {headingIsLocation && (
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {/* Como en las v1: el texto suelto en el h3 flex se corta en el borde, sin «…». */}
              {heading}
            </h3>
          )}
        </div>
        {price !== null && (
          <p className="shrink-0 text-base font-bold">
            {price}
          </p>
        )}
      </div>

      {location !== null && (
        <div className="mb-2 flex items-center text-muted-foreground">
          <MapPin className="mr-1 h-3.5 w-3.5" />
          <p className="line-clamp-1 text-sm">{location}</p>
        </div>
      )}

      {description !== null && (
        <p className="mb-3 line-clamp-3 flex-1 text-sm text-muted-foreground sm:mb-4 sm:text-base">
          {description}
        </p>
      )}

      {stats !== null && (
        <div className="mt-auto flex justify-between text-sm">{stats}</div>
      )}

      {reference !== null && (
        <div className="mt-3 flex items-center border-t pt-2 text-xs text-muted-foreground">
          <Building className="mr-1 h-3 w-3" />
          <span>Ref: {reference}</span>
        </div>
      )}
    </CardContent>
  );
}
