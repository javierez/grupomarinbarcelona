"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Bed, Bath, SquareIcon as SquareFoot, MapPin } from "lucide-react";
import { formatPrice, formatNumber, resolvePriceDisplay } from "~/lib/utils";
import type { ListingCardData } from "~/server/queries/listings";
import {
  type CardDisplayConfig,
  DEFAULT_CARD_DISPLAY,
  buildLocationLabel,
} from "~/lib/card-display";
import { getWatermarkedImageUrl } from "~/lib/image-url";
import { getBankOwnedLabel, getPropertyTypeLabel } from "~/lib/data";
import { buildPropertySlug, buildPropertyImageAlt } from "~/lib/property-slug";

interface PropertyCardProps {
  listing: ListingCardData;
  index?: number;
  watermarkEnabled?: boolean;
  showDescription?: boolean;
  showReference?: boolean;
  cardDisplay?: CardDisplayConfig;
}

const formatListingType = (type: string) => {
  switch (type) {
    case "Sale":
      return "Venta";
    case "Rent":
      return "Alquiler";
    case "RentWithOption":
      return "Alquiler";
    case "RoomSharing":
      return "Habitación";
    default:
      return type;
  }
};

export const PropertyCard = React.memo(function PropertyCard({
  listing,
  index = 0,
  watermarkEnabled = false,
  showDescription = true,
  showReference = true,
  cardDisplay = DEFAULT_CARD_DISPLAY,
}: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [image2Loaded, setImage2Loaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for triggering animation when visible
  useEffect(() => {
    if (!listing.isOportunidad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [listing.isOportunidad]);

  // Property types where bedrooms/bathrooms don't apply
  const hideRooms = ["solar", "garaje", "edificio", "oficina", "industrial", "trastero"].includes(
    listing.propertyType?.toLowerCase() ?? "",
  );
  const useEstancias = listing.propertyType?.toLowerCase() === "local";

  // Get primary image with proper fallback
  const defaultPlaceholder = "/properties/suburban-dream.png";
  const [imageSrc, setImageSrc] = useState(
    getWatermarkedImageUrl(listing.imageUrl, watermarkEnabled) || defaultPlaceholder,
  );
  const [imageSrc2, setImageSrc2] = useState(
    getWatermarkedImageUrl(listing.imageUrl2 ?? listing.imageUrl, watermarkEnabled) || defaultPlaceholder,
  );


  const onImageError = () => {
    setImageSrc(defaultPlaceholder);
  };

  const onImage2Error = () => {
    setImageSrc2(defaultPlaceholder);
  };

  const imageAlt = buildPropertyImageAlt({
    title: listing.title,
    propertyType: listing.propertyType,
    city: listing.city,
    bedrooms: listing.bedrooms,
    squareMeter: listing.squareMeter,
    listingType: listing.listingType,
  });

  return (
    <Link
      href={`/propiedades/${buildPropertySlug({
        listingId: listing.listingId,
        title: listing.title,
        propertyType: listing.propertyType,
        city: listing.city,
        bedrooms: listing.bedrooms,
        listingType: listing.listingType,
      })}`}
      className="block"
      role="article"
      aria-label={imageAlt}
    >
      <Card
        ref={cardRef}
        className={`group flex h-full flex-col overflow-hidden rounded-2xl border-border/60 bg-transparent shadow-none transition-colors hover:border-foreground/30 ${listing.isOportunidad && isVisible ? "animate-oportunidad" : ""}`}
        style={listing.isOportunidad && isVisible ? { animationDelay: `${index * 200}ms` } : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <div className="relative h-full w-full">
            {/* First Image */}
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-all duration-500 group-hover:scale-[1.04] ${
                isHovered ? "opacity-0" : "opacity-100"
              } ${imageSrc === defaultPlaceholder || listing.status === "Sold" || listing.status === "Vendido" ? "grayscale" : ""}`}
              priority={index < 3}
              loading={index < 3 ? undefined : "lazy"}
              onLoad={() => setImageLoaded(true)}
              onError={onImageError}
              quality={75}
              unoptimized={watermarkEnabled}
            />
            {/* Second Image */}
            <Image
              src={imageSrc2}
              alt={imageAlt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-all duration-500 group-hover:scale-[1.04] ${
                isHovered ? "opacity-100" : "opacity-0"
              } ${imageSrc2 === defaultPlaceholder || listing.status === "Sold" || listing.status === "Vendido" ? "grayscale" : ""}`}
              loading="lazy"
              onLoad={() => setImage2Loaded(true)}
              onError={onImage2Error}
              quality={75}
              unoptimized={watermarkEnabled}
            />
            {(!imageLoaded || !image2Loaded) && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}
          </div>

          {/* Top Left - Property subtype (Ático, Chalet…), falling back to the
              property type (Piso, Casa…) — always visible */}
          <Badge className="absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-foreground hover:bg-white">
            {listing.propertySubtype?.trim()
              ? getPropertyTypeLabel(listing.propertySubtype)
              : getPropertyTypeLabel(listing.propertyType)}
          </Badge>

          {/* Top Right - Operation (Venta / Alquiler), primary. Hidden only for
              terminal states, which take over via the centre overlay. */}
          {!(listing.status === "Vendido" ||
            listing.status === "Alquilado") && (
            <Badge className="absolute right-3 top-3 z-10 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-background hover:bg-foreground">
              {formatListingType(listing.listingType)}
            </Badge>
          )}

          {/* Centred status pill: terminal states only (Vendido / Alquilado). */}
          {(listing.status === "Vendido" ||
            listing.status === "Alquilado") && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <span className="whitespace-nowrap rounded-full bg-rose-600/95 px-8 py-3 text-base font-semibold uppercase tracking-[0.3em] text-white shadow-2xl ring-1 ring-rose-500/40 backdrop-blur-md">
                {listing.status}
              </span>
            </div>
          )}

          {/* Reservado — centred pill matching the Vendido overlay (same
              position & size) but amber, and without graying the photo since
              the listing is still on the market. Never on terminal listings. */}
          {listing.reservado &&
            listing.status !== "Vendido" &&
            listing.status !== "Alquilado" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <span className="whitespace-nowrap rounded-full bg-amber-500/95 px-8 py-3 text-base font-semibold uppercase tracking-[0.3em] text-white shadow-2xl ring-1 ring-amber-400/40 backdrop-blur-md">
                  Reservado
                </span>
              </div>
            )}

          {/* Bottom Left - Bank Owned (pill) */}
          {!!listing.isBankOwned && (
            <Badge
              variant="outline"
              className="absolute bottom-3 left-3 z-10 rounded-full border-0 bg-amber-50/95 px-3 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-amber-900 shadow-sm backdrop-blur-sm"
            >
              {getBankOwnedLabel(listing.propertyType)}
            </Badge>
          )}

          {/* Bottom Right - Oportunidad indicator */}
          {!!listing.isOportunidad && (
            <Badge className="absolute bottom-3 right-3 z-10 rounded-full border-0 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-white shadow-md">
              Oportunidad
            </Badge>
          )}
        </div>

        <CardContent className="flex flex-1 flex-col px-6 py-7">
          {(() => {
            // Location label ("city › <field>"), street is never shown.
            const locationLabel = buildLocationLabel(
              listing,
              cardDisplay.cardLocationField,
            );
            const titleText =
              cardDisplay.cardTitle === "location"
                ? locationLabel
                : listing.title;
            const heading =
              titleText ||
              getPropertyTypeLabel(listing.propertyType) ||
              "Propiedad";

            // Eyebrow shows the location, but not when the title already does.
            const showEyebrow =
              cardDisplay.cardEyebrow === "location" &&
              cardDisplay.cardTitle !== "location" &&
              !!locationLabel;

            return (
              <>
                {showEyebrow && (
                  <div className="mb-2 flex items-center text-[11px] font-medium uppercase tracking-eyebrow text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {locationLabel}
                    </span>
                  </div>
                )}

                {cardDisplay.cardTitle !== "none" && (
                  <h3 className="mb-3 flex items-center gap-1.5 line-clamp-1 text-lg font-medium tracking-tight text-foreground">
                    {cardDisplay.cardTitle === "location" && (
                      <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    {heading}
                  </h3>
                )}
              </>
            );
          })()}

          {showDescription && (
            <p className="mb-4 flex-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {listing.description?.replace(/\s*con\s+null\s+habitaciones/gi, "") ||
                `${getPropertyTypeLabel(listing.propertyType)}${((listing.squareMeter ?? 0) > 0) ? ` de ${formatNumber(listing.squareMeter ?? 0)} m²` : ""}${!hideRooms && listing.bedrooms != null && listing.bedrooms > 0 ? ` con ${listing.bedrooms} ${useEstancias ? "estancias" : "habitaciones"}` : ""}`}
            </p>
          )}

          {(() => {
            const isRental = ["Rent", "RentWithOption", "RoomSharing"].includes(
              listing.listingType,
            );
            const priceDisplay = resolvePriceDisplay({
              price: listing.price,
              hidePrice: listing.hidePrice,
              status: listing.status,
              isRental,
            });
            if (priceDisplay.mode === "hidden") return null;
            if (priceDisplay.mode === "consult") {
              return (
                <p className="mb-4 text-2xl font-medium tracking-tight text-foreground">
                  A consultar
                </p>
              );
            }
            const num = Number(listing.price);
            return (
              <p className="mb-4 text-2xl font-medium tracking-tight text-foreground">
                {!num || isNaN(num) ? (
                  "A consultar"
                ) : (
                  <>
                    {formatPrice(num)}€
                    {isRental && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /mes
                      </span>
                    )}
                  </>
                )}
              </p>
            );
          })()}

          {((!hideRooms && listing.bedrooms != null && listing.bedrooms > 0) ||
            (!hideRooms && listing.bathrooms != null && Number(listing.bathrooms) > 0) ||
            ((listing.squareMeter ?? 0) > 0)) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            {!hideRooms && listing.bedrooms != null && listing.bedrooms > 0 && (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Bed className="h-4 w-4 shrink-0" />
                <span>
                  {listing.bedrooms}{" "}
                  {useEstancias
                    ? (listing.bedrooms === 1 ? "Est" : "Ests")
                    : (listing.bedrooms === 1 ? "Hab" : "Habs")}
                </span>
              </div>
            )}
            {!hideRooms && listing.bathrooms != null && Number(listing.bathrooms) > 0 && (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Bath className="h-4 w-4 shrink-0" />
                <span>
                  {Math.floor(Number(listing.bathrooms))}{" "}
                  {Math.floor(Number(listing.bathrooms)) === 1
                    ? "Baño"
                    : "Baños"}
                </span>
              </div>
            )}
            {((listing.squareMeter ?? 0) > 0) && (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <SquareFoot className="h-4 w-4 shrink-0" />
                <span>{formatNumber(listing.squareMeter ?? 0)} m²</span>
              </div>
            )}
            {showReference && (
              <span className="ml-auto whitespace-nowrap text-xs">Ref: {listing.idealistaReference?.trim() || listing.listingId.toString()}</span>
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
});
