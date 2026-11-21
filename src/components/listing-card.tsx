"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCuenta, useV1Inicial } from "~/components/header-style-context";
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
import { roomsShortLabel, roomsWord, showsRooms } from "~/lib/property-rooms";
import {
  isRentalListingType,
  isReservedListing,
  operationLabel,
} from "~/lib/listing-types";
import {
  CardHoverVideo,
  CardVideoBadge,
  type CardVideoOptions,
} from "~/components/video/card-video";
import {
  isAccount137,
  ACCOUNT_137_ACCENT_GREEN,
} from "~/lib/account-overrides/137";
import {
  ListingCardV1Badges,
  ListingCardV1Body,
  V1_CARD_CLASS,
} from "~/components/listing-card-v1";

// Ana Díaz (137): bold green price on the cards, as on its v1 site.
const PRICE_STYLE_137 = { color: ACCOUNT_137_ACCENT_GREEN, fontWeight: 700 };

interface PropertyCardProps {
  listing: ListingCardData;
  index?: number;
  watermarkEnabled?: boolean;
  showDescription?: boolean;
  showReference?: boolean;
  cardDisplay?: CardDisplayConfig;
  /** Video badge / hover preview. Omitted = neither (original card). */
  video?: CardVideoOptions;
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
  video,
}: PropertyCardProps) {
  const acct137 = isAccount137(useCuenta());
  const v1Inicial = useV1Inicial();
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

  // Naves (local + subtipo "Nave industrial") tampoco llevan habitaciones.
  const hideRooms = !showsRooms(listing.propertyType, listing.propertySubtype);

  // Get primary image with proper fallback
  const defaultPlaceholder = "/properties/suburban-dream.png";
  const [imageSrc, setImageSrc] = useState(
    getWatermarkedImageUrl(listing.imageUrl, watermarkEnabled) || defaultPlaceholder,
  );
  const [imageSrc2, setImageSrc2] = useState(
    getWatermarkedImageUrl(listing.imageUrl2 ?? listing.imageUrl, watermarkEnabled) || defaultPlaceholder,
  );


  // Con marca de agua, `imageUrl` es la copia horneada en S3 y la original va
  // en `imageUrlFallback`: si la copia aún no existe, la original antes que el
  // marcador.
  const onImageError = () => {
    const fallback = listing.imageUrlFallback;
    setImageSrc((src) => (fallback && src !== fallback ? fallback : defaultPlaceholder));
  };

  const onImage2Error = () => {
    const fallback = listing.imageUrl2Fallback ?? listing.imageUrlFallback;
    setImageSrc2((src) => (fallback && src !== fallback ? fallback : defaultPlaceholder));
  };

  const imageAlt = buildPropertyImageAlt({
    title: listing.title,
    propertyType: listing.propertyType,
    propertySubtype: listing.propertySubtype,
    city: listing.city,
    bedrooms: listing.bedrooms,
    squareMeter: listing.squareMeter,
    listingType: listing.listingType,
  });

  // Location label ("city › <field>"), street is never shown.
  // v1's cards put the province after the city, never the neighbourhood
  // («León», «Villaquilambre, León»), whatever `cardLocationField` says.
  const locationLabel = buildLocationLabel(
    listing,
    cardDisplay.aspectoV1 === true ? "province" : cardDisplay.cardLocationField,
  );
  const titleText =
    cardDisplay.cardTitle === "location" ? locationLabel : listing.title;
  const heading =
    titleText || getPropertyTypeLabel(listing.propertyType) || "Propiedad";
  // Eyebrow shows the location, but not when the title already does.
  const showEyebrow =
    cardDisplay.cardEyebrow === "location" &&
    cardDisplay.cardTitle !== "location" &&
    !!locationLabel;
  const descriptionText =
    listing.description?.replace(/\s*con\s+null\s+habitaciones/gi, "") ||
    `${getPropertyTypeLabel(listing.propertyType)}${((listing.squareMeter ?? 0) > 0) ? ` de ${formatNumber(listing.squareMeter ?? 0)} m²` : ""}${!hideRooms && listing.bedrooms != null && listing.bedrooms > 0 ? ` con ${listing.bedrooms} ${roomsWord(listing.propertyType)}` : ""}`;
  // La v1 de El Mito (`v1Inicial`) ponía el número del inmueble, no su
  // referencia de Idealista («Ref: 1245265», no «Ref: LL261-6»).
  const reference = v1Inicial
    ? listing.listingId.toString()
    : listing.idealistaReference?.trim() || listing.listingId.toString();

  const isRental = isRentalListingType(listing.listingType);
  const priceDisplay = resolvePriceDisplay({
    price: listing.price,
    hidePrice: listing.hidePrice,
    status: listing.status,
    isRental,
  });
  // The v1 look (`features_props.aspectoV1`): v1's labels on the photo and
  // v1's body, from listing-card-v1.tsx. Ana Díaz (137) keeps her own body.
  const v1 = cardDisplay.aspectoV1 === true;
  const typeLabel = listing.propertySubtype?.trim()
    ? getPropertyTypeLabel(listing.propertySubtype)
    : getPropertyTypeLabel(listing.propertyType);
  const operation =
    (cardDisplay.cardOperationLabel === "long"
      ? operationLabel(listing.listingType)
      : null) ?? formatListingType(listing.listingType);
  const terminal = listing.status === "Vendido" || listing.status === "Alquilado";

  const priceClass = `text-2xl font-medium tracking-tight text-foreground ${acct137 ? "leading-none" : "mb-4"}`;
  const priceNum = Number(listing.price);
  const priceContent =
    priceDisplay.mode === "hidden" ? null : priceDisplay.mode === "consult" || !priceNum || isNaN(priceNum) ? (
      "A consultar"
    ) : (
      <>
        {formatPrice(priceNum)}€
        {isRental && (
          <span className="text-sm font-normal text-muted-foreground">
            /mes
          </span>
        )}
      </>
    );
  const priceBlock =
    priceContent === null ? null : (
      <p className={priceClass} style={acct137 ? PRICE_STYLE_137 : undefined}>
        {priceContent}
      </p>
    );

  const hasBeds =
    !hideRooms && listing.bedrooms != null && listing.bedrooms > 0;
  const hasBaths =
    !hideRooms && listing.bathrooms != null && Number(listing.bathrooms) > 0;
  const hasArea = (listing.squareMeter ?? 0) > 0;
  const hasStats = hasBeds || hasBaths || hasArea;
  const statIcon = v1 ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0";
  const statsItems = (
    <>
      {hasBeds && (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Bed className={statIcon} />
          <span>
            {listing.bedrooms}{" "}
            {roomsShortLabel(listing.bedrooms ?? 0, listing.propertyType)}
          </span>
        </div>
      )}
      {hasBaths && (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Bath className={statIcon} />
          <span>
            {Math.floor(Number(listing.bathrooms))}{" "}
            {Math.floor(Number(listing.bathrooms)) === 1 ? "Baño" : "Baños"}
          </span>
        </div>
      )}
      {hasArea && (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <SquareFoot className={statIcon} />
          <span>{formatNumber(listing.squareMeter ?? 0)} m²</span>
        </div>
      )}
    </>
  );

  return (
    <Link
      href={`/propiedades/${buildPropertySlug({
        listingId: listing.listingId,
        title: listing.title,
        propertyType: listing.propertyType,
        propertySubtype: listing.propertySubtype,
        city: listing.city,
        bedrooms: listing.bedrooms,
        listingType: listing.listingType,
      })}`}
      className="block h-full"
      aria-label={imageAlt}
      data-vesta="inmueble.tarjeta" data-vesta-id={listing.listingId.toString()}
    >
      <Card
        ref={cardRef}
        className={`${v1 ? V1_CARD_CLASS : "group flex h-full flex-col overflow-hidden rounded-2xl border-border/60 bg-transparent shadow-none transition-colors hover:border-foreground/30"} ${listing.isOportunidad && isVisible ? "animate-oportunidad" : ""}`}
        style={listing.isOportunidad && isVisible ? { animationDelay: `${index * 200}ms` } : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden" data-vesta="inmueble.foto">
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
            {video?.preview && listing.videoUrl && (
              <CardHoverVideo src={listing.videoUrl} active={isHovered} />
            )}
          </div>

          {/* Under the type pill: the listing has a video. */}
          {video?.badge && listing.videoUrl && (
            <CardVideoBadge className={v1 ? "absolute left-2 top-10" : "absolute left-3 top-11"} />
          )}

          {v1 ? (
            <ListingCardV1Badges
              listing={listing}
              typeLabel={typeLabel}
              operation={operation}
              terminal={terminal}
            />
          ) : (
            <>
              {/* Top Left - Property subtype (Ático, Chalet…), falling back to the
                  property type (Piso, Casa…) — always visible */}
              <Badge className="absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-foreground hover:bg-white">
                {typeLabel}
              </Badge>

              {/* Top Right - Operation (Venta / Alquiler), primary. Hidden only for
                  terminal states, which take over via the centre overlay. */}
              {!terminal && (
                <Badge className="absolute right-3 top-3 z-10 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-background hover:bg-foreground">
                  {operation}
                </Badge>
              )}
            </>
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
          {isReservedListing(listing) &&
            listing.status !== "Vendido" &&
            listing.status !== "Alquilado" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <span className="whitespace-nowrap rounded-full bg-amber-500/95 px-8 py-3 text-base font-semibold uppercase tracking-[0.3em] text-white shadow-2xl ring-1 ring-amber-400/40 backdrop-blur-md">
                  Reservado
                </span>
              </div>
            )}

          {/* Bottom Left - Bank Owned (pill) */}
          {!v1 && !!listing.isBankOwned && (
            <Badge
              variant="outline"
              className="absolute bottom-3 left-3 z-10 rounded-full border-0 bg-amber-50/95 px-3 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-amber-900 shadow-sm backdrop-blur-sm"
            >
              {getBankOwnedLabel(listing.propertyType)}
            </Badge>
          )}

          {/* Bottom Right - Destacado (lo marca la agencia) y Oportunidad */}
          {!v1 && (!!listing.isFeatured || !!listing.isOportunidad) && (
            <div className="absolute bottom-3 right-3 z-10 flex gap-1.5">
              {!!listing.isFeatured && (
                <Badge className="rounded-full border-0 bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-foreground hover:bg-white">
                  Destacado
                </Badge>
              )}
              {!!listing.isOportunidad && (
                <Badge className="rounded-full border-0 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-white shadow-md">
                  Oportunidad
                </Badge>
              )}
            </div>
          )}
        </div>

        {acct137 ? (
          /* Ana Díaz (137), as its v1 cards: location → price (dominant) →
             description → stats → a subtle reference. No title. */
          <CardContent className="flex flex-1 flex-col p-4">
            {showEyebrow && (
              <div className="mb-1.5 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{locationLabel}</span>
              </div>
            )}
            {priceBlock}
            {showDescription && (
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                {descriptionText}
              </p>
            )}
            {hasStats && (
              <div className="mt-3 flex items-center gap-5 border-t pt-3 text-sm text-muted-foreground">
                {statsItems}
              </div>
            )}
            {showReference && (
              <div className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground/70">
                Ref. {reference}
              </div>
            )}
          </CardContent>
        ) : v1 ? (
          <ListingCardV1Body
            heading={cardDisplay.cardTitle === "none" ? null : heading}
            headingIsLocation={cardDisplay.cardTitle === "location"}
            price={priceContent}
            location={showEyebrow ? locationLabel : null}
            description={showDescription ? descriptionText : null}
            stats={hasStats ? statsItems : null}
            reference={showReference ? reference : null}
          />
        ) : (
        <CardContent className="flex flex-1 flex-col px-6 py-7">
          {showEyebrow && (
            <div className="mb-2 flex items-center text-[11px] font-medium uppercase tracking-eyebrow text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {locationLabel}
              </span>
            </div>
          )}

          {/* Always reserves two lines so every card in a row keeps the
              same height and the rows below stay aligned, however long the
              title is. `line-clamp-2` sets its own display, so this must
              not also carry `flex` — the icon goes inline instead. */}
          {cardDisplay.cardTitle !== "none" && (
            <h3 className="mb-3 line-clamp-2 min-h-[3.5rem] text-lg font-medium leading-[1.75rem] tracking-tight text-foreground">
              {cardDisplay.cardTitle === "location" && (
                <MapPin className="mr-1.5 inline-block h-4 w-4 shrink-0 align-[-3px] text-muted-foreground" />
              )}
              {heading}
            </h3>
          )}

          {showDescription && (
            <p className="mb-4 flex-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {descriptionText}
            </p>
          )}

          {priceBlock}

          {hasStats && (
          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
            {statsItems}
            {showReference && (
              <span className="ml-auto whitespace-nowrap text-xs">Ref: {reference}</span>
            )}
          </div>
          )}
        </CardContent>
        )}
      </Card>
    </Link>
  );
});
