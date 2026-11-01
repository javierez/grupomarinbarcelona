"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ListingCardData } from "~/server/queries/listings";
import { formatPrice, resolvePriceDisplay } from "~/lib/utils";
import { getWatermarkedImageUrl } from "~/lib/image-url";
import { getPropertyTypeLabel } from "~/lib/data";
import { buildPropertySlug, buildPropertyImageAlt } from "~/lib/property-slug";
import { isRentalListingType, isReservedListing } from "~/lib/listing-types";

interface PropertyGridV3Props {
  listings: ListingCardData[];
  watermarkEnabled?: boolean;
}

const OPERATION: Record<string, string> = {
  Sale: "Venta",
  Rent: "Alquiler",
  RentWithOption: "Alquiler",
  RoomSharing: "Habitación",
};

function priceLabel(listing: ListingCardData): string | null {
  const isRental = isRentalListingType(listing.listingType);
  const display = resolvePriceDisplay({
    price: listing.price,
    hidePrice: listing.hidePrice,
    status: listing.status,
    isRental,
  });
  if (display.mode === "hidden") return null;
  const num = Number(listing.price);
  if (display.mode === "consult" || !num || isNaN(num)) return "A consultar";
  return `${formatPrice(num)} €${isRental ? "/mes" : ""}`;
}

/** "Madrid > Retiro", or whichever of the two exists. */
function locationLabel(listing: ListingCardData): string {
  const city = listing.municipality || listing.city;
  const zone = listing.neighborhood;
  if (city && zone && zone !== city) return `${city} > ${zone}`;
  return city || zone || "";
}

function V3Card({
  listing,
  index,
  watermarkEnabled,
}: {
  listing: ListingCardData;
  index: number;
  watermarkEnabled: boolean;
}) {
  const href = `/propiedades/${buildPropertySlug({
    listingId: listing.listingId,
    title: listing.title,
    propertyType: listing.propertyType,
    propertySubtype: listing.propertySubtype,
    city: listing.city,
    bedrooms: listing.bedrooms,
    listingType: listing.listingType,
  })}`;
  const alt = buildPropertyImageAlt({
    title: listing.title,
    propertyType: listing.propertyType,
    propertySubtype: listing.propertySubtype,
    city: listing.city,
    bedrooms: listing.bedrooms,
    squareMeter: listing.squareMeter,
    listingType: listing.listingType,
  });
  const src =
    getWatermarkedImageUrl(listing.imageUrl, watermarkEnabled) ||
    "/properties/suburban-dream.png";
  const title =
    listing.title || getPropertyTypeLabel(listing.propertyType) || "Inmueble";
  const closed = listing.status === "Vendido" || listing.status === "Alquilado";
  const flag = closed
    ? listing.status
    : isReservedListing(listing)
      ? "Reservado"
      : null;
  const price = priceLabel(listing);
  const location = locationLabel(listing);

  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <Link
        href={href}
        aria-label={alt}
        title={title}
        className="group relative block aspect-[16/9] overflow-hidden bg-muted"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={index < 2}
          unoptimized={watermarkEnabled}
          className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] ${closed ? "grayscale" : ""}`}
        />
        {/* Legibility wash, stronger on hover. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-colors duration-500 group-hover:from-black/75 group-hover:via-black/20" />

        {flag && (
          <span className="absolute left-4 top-4 bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-foreground">
            {flag}
          </span>
        )}
        <span className="absolute right-4 top-4 -translate-y-1.5 border border-white px-3 py-1.5 text-xs font-light text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Ver inmueble
        </span>

        <div className="absolute inset-x-4 bottom-3 flex items-end gap-4 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.35)] sm:inset-x-5 sm:bottom-3.5">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-normal sm:text-2xl">{title}</h3>
            {location && (
              <p className="truncate text-xs font-light sm:text-sm">{location}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-light sm:text-sm">
              {OPERATION[listing.listingType] ?? listing.listingType}
            </p>
            {price && <p className="text-lg font-normal sm:text-2xl">{price}</p>}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * `features_props.propertiesStyle: "v3"`: two columns, the second dropped by
 * 80px so the cards interlock. Desktop splits by alternation (1,3,5 | 2,4,6)
 * so reading order still runs left-right, top-down.
 */
export function PropertyGridV3({
  listings,
  watermarkEnabled = false,
}: PropertyGridV3Props) {
  const columns = [
    listings.filter((_, i) => i % 2 === 0),
    listings.filter((_, i) => i % 2 === 1),
  ];

  return (
    <>
      {/* Mobile: one column, in order. */}
      <div className="grid gap-2 md:hidden">
        {listings.map((listing, i) => (
          <V3Card
            key={listing.listingId.toString()}
            listing={listing}
            index={i}
            watermarkEnabled={watermarkEnabled}
          />
        ))}
      </div>
      <div className="hidden grid-cols-2 items-start gap-2 md:grid">
        {columns.map((column, c) => (
          <div key={c} className={`grid gap-20 ${c === 1 ? "mt-20" : ""}`}>
            {column.map((listing) => (
              <V3Card
                key={listing.listingId.toString()}
                listing={listing}
                index={listings.indexOf(listing)}
                watermarkEnabled={watermarkEnabled}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
