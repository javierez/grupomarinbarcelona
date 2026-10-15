import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Bed, Bath, SquareIcon as SquareFoot, MapPin } from "lucide-react";
import { formatPrice, formatNumber, resolvePriceDisplay } from "~/lib/utils";
import type { ListingCardData } from "~/server/queries/listings";
import { getBankOwnedLabel } from "~/lib/data";
import { buildPropertySlug } from "~/lib/property-slug";
import { roomsShortLabel, showsRooms } from "~/lib/property-rooms";
import { isRentalListingType } from "~/lib/listing-types";

const formatListingType = (type: string) => {
  switch (type) {
    case "Sale":
      return "Venta";
    case "Rent":
    case "RentWithOption":
      return "Alquiler";
    case "RoomSharing":
      return "Habitación";
    default:
      return type;
  }
};

export function feedListingHref(listing: ListingCardData): string {
  return `/propiedades/${buildPropertySlug({
    listingId: listing.listingId,
    title: listing.title,
    propertyType: listing.propertyType,
    propertySubtype: listing.propertySubtype,
    city: listing.city,
    bedrooms: listing.bedrooms,
    listingType: listing.listingType,
  })}`;
}

const pill =
  "rounded-full border-white/20 bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-white backdrop-blur-md";

/** Type / operation / status pills. */
export function FeedBadges({ listing }: { listing: ListingCardData }) {
  const { propertyType, propertySubtype, listingType, isBankOwned, isOportunidad, reservado, status } = listing;
  // Prefers the more specific subtype, falling back to the type.
  const displayType = propertySubtype?.trim() || propertyType || null;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {displayType && (
        <Badge variant="secondary" className={pill}>
          {displayType.charAt(0).toUpperCase() + displayType.slice(1)}
        </Badge>
      )}
      <Badge variant="secondary" className={pill}>
        {formatListingType(listingType)}
      </Badge>
      {isBankOwned && (
        <Badge className="rounded-full bg-amber-50/95 px-3 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-amber-900 backdrop-blur-sm">
          {getBankOwnedLabel(propertyType)}
        </Badge>
      )}
      {isOportunidad && (
        <Badge className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-white">
          Oportunidad
        </Badge>
      )}
      {reservado && status !== "Vendido" && status !== "Alquilado" && (
        <Badge className="rounded-full bg-amber-500/95 px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-white backdrop-blur-sm">
          Reservado
        </Badge>
      )}
    </div>
  );
}

/**
 * Location, title, price and stats of a feed item. "overlay" sits on the photo
 * (the original look); "panel" is the desktop side column next to a vertical
 * video, which has room for the description too.
 */
export function FeedDetails({
  listing,
  variant = "overlay",
}: {
  listing: ListingCardData;
  variant?: "overlay" | "panel";
}) {
  const { title, street, price, listingType, propertyType, propertySubtype, bedrooms, bathrooms, squareMeter, city, province, status } = listing;
  const isRental = isRentalListingType(listingType);
  // Mismas reglas que las tarjetas del listado (~/lib/property-rooms).
  const roomsApply = showsRooms(propertyType, propertySubtype);
  const bathroomCount = Math.floor(parseFloat(bathrooms ?? "0"));
  const showBeds = roomsApply && (bedrooms ?? 0) > 0;
  const showBaths = roomsApply && bathroomCount > 0;
  const priceDisplay = resolvePriceDisplay({ price, hidePrice: listing.hidePrice, status, isRental });
  const num = Number(price);
  const isPanel = variant === "panel";

  return (
    <>
      {(city ?? province) && (
        <div className="mb-2 flex items-center text-[11px] font-medium uppercase tracking-eyebrow text-white/70">
          <MapPin className="mr-1 h-3 w-3" />
          <span>{[city, province].filter(Boolean).join(", ")}</span>
        </div>
      )}

      <Link href={feedListingHref(listing)}>
        <h2 className={`mb-3 font-medium leading-tight tracking-tight text-white ${isPanel ? "text-3xl" : "text-2xl"}`}>
          {title ?? street ?? "Propiedad"}
        </h2>
      </Link>

      {priceDisplay.mode !== "hidden" && (
        <p className="mb-4 text-3xl font-medium tracking-tight text-white">
          {priceDisplay.mode === "consult" || !num || isNaN(num) ? (
            "A consultar"
          ) : (
            <>
              {formatPrice(num)}€
              {isRental && <span className="text-base font-normal text-white/80">/mes</span>}
            </>
          )}
        </p>
      )}

      <div className="flex items-center gap-5 border-t border-white/15 pt-4 text-sm text-white/85">
        {showBeds && (
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4" />
            <span>
              {bedrooms} {roomsShortLabel(bedrooms ?? 0, propertyType)}
            </span>
          </div>
        )}
        {showBaths && (
          <div className="flex items-center gap-1.5">
            <Bath className="h-4 w-4" />
            <span>
              {bathroomCount} {bathroomCount === 1 ? "Baño" : "Baños"}
            </span>
          </div>
        )}
        {(squareMeter ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <SquareFoot className="h-4 w-4" />
            <span>{formatNumber(squareMeter!)} m²</span>
          </div>
        )}
      </div>

      {isPanel && listing.description && (
        <p className="mt-5 line-clamp-6 text-sm leading-relaxed text-white/75">
          {listing.description}
        </p>
      )}
    </>
  );
}

/** "Ver ficha" + "Solicitar visita" buttons (reels style and desktop panel). */
export function FeedActions({ listing }: { listing: ListingCardData }) {
  const href = feedListingHref(listing);
  return (
    <div className="mt-5 flex gap-2">
      <Link
        href={href}
        className="flex-1 rounded-xl bg-white px-4 py-2.5 text-center text-sm font-semibold text-neutral-900 transition-colors hover:bg-white/90"
      >
        Ver ficha
      </Link>
      <Link
        href={`${href}#contacto`}
        className="flex-1 rounded-xl border border-white/50 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        Solicitar visita
      </Link>
    </div>
  );
}
