"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import {
  Bed,
  Bath,
  SquareIcon as SquareFoot,
  MapPin,
  Building,
} from "lucide-react";
import { getBankOwnedLabel, getPropertyTypeLabel, type Property } from "~/lib/data";
import { getWatermarkedImageUrl } from "~/lib/image-url";
import { buildPropertySlug, buildPropertyImageAlt } from "~/lib/property-slug";
import { resolvePriceDisplay } from "~/lib/utils";

interface PropertyCardProps {
  property: Property;
  watermarkEnabled?: boolean;
}

export function PropertyCard({ property, watermarkEnabled = false }: PropertyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Property types where bedrooms/bathrooms don't apply
  const hideRooms = ["solar", "garaje", "edificio", "oficina", "industrial", "trastero"].includes(
    property.propertyType?.toLowerCase(),
  );
  const useEstancias = property.propertyType?.toLowerCase() === "local";

  // Get primary and secondary images with proper fallbacks
  const defaultPlaceholder = "/properties/suburban-dream.png";
  const rawPrimaryImage =
    property.imageUrl && property.imageUrl !== ""
      ? property.imageUrl
      : defaultPlaceholder;
  const primaryImage = getWatermarkedImageUrl(rawPrimaryImage, watermarkEnabled) || defaultPlaceholder;

  // For secondary image, use the second image from the array or fall back to primary image
  const rawSecondaryImage = property.images?.[1]?.url ?? rawPrimaryImage;
  const secondaryImage = getWatermarkedImageUrl(rawSecondaryImage, watermarkEnabled) || primaryImage;

  // Format numbers consistently to avoid hydration issues
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-ES").format(num);
  };

  const listingType =
    property.status === "for-rent" || property.status === "rented"
      ? "Rent"
      : "Sale";
  const slug = buildPropertySlug({
    listingId: property.listingId ?? property.id,
    title: property.title,
    propertyType: property.propertyType,
    city: property.city,
    bedrooms: property.bedrooms,
    listingType,
  });
  const propertyHref = `/propiedades/${slug}`;
  const imageAlt = buildPropertyImageAlt({
    title: property.title,
    propertyType: property.propertyType,
    city: property.city,
    bedrooms: property.bedrooms,
    squareMeter: property.squareFeet,
    listingType,
  });

  const isReservado =
    !!property.reservado &&
    property.status !== "sold" &&
    property.status !== "rented";
  const statusLabel =
    property.status === "sold"
      ? "Vendido"
      : property.status === "rented"
        ? "Alquilado"
        : isReservado
          ? "Reservado"
          : property.status === "for-rent"
            ? "En Alquiler"
            : "En Venta";

  return (
    <Card
      className="group w-full overflow-hidden rounded-2xl border-border/60 bg-transparent shadow-none transition-colors hover:border-foreground/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={propertyHref}>
          <div className="relative h-full w-full">
            <Image
              src={primaryImage || "/placeholder.svg"}
              alt={imageAlt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-500 group-hover:scale-[1.04] ${isHovered ? "opacity-0" : "opacity-100"}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              unoptimized={watermarkEnabled}
            />
            <Image
              src={secondaryImage || "/placeholder.svg"}
              alt={`${imageAlt} - Vista alternativa`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-500 group-hover:scale-[1.04] ${isHovered ? "opacity-100" : "opacity-0"}`}
              loading="lazy"
              unoptimized={watermarkEnabled}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted" />
            )}
          </div>
        </Link>
        {/* Top Left - Property type (Piso, Casa…) */}
        <Badge className="absolute left-3 top-3 z-10 rounded-full bg-white px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-foreground hover:bg-white">
          {getPropertyTypeLabel(property.propertyType)}
        </Badge>

        {/* Top Right - Operation status (En Venta / En Alquiler / Reservado / Vendido) */}
        <Badge
          className="absolute right-3 top-3 z-10 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-background hover:bg-foreground"
        >
          {statusLabel}
        </Badge>
        {!!property.isBankOwned && (
          <Badge
            variant="outline"
            className="absolute bottom-3 left-3 z-10 rounded-full border-0 bg-amber-50/95 px-3 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-amber-900 shadow-sm backdrop-blur-sm"
          >
            {getBankOwnedLabel(property.propertyType)}
          </Badge>
        )}
      </div>

      <CardContent className="px-6 py-7">
        <div className="mb-2 flex items-center text-[11px] font-medium uppercase tracking-eyebrow text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {property.city}
          </span>
        </div>

        <Link
          href={propertyHref}
          className="block transition-colors"
        >
          <h3 className="mb-3 line-clamp-1 text-lg font-medium tracking-tight text-foreground">
            {property.title}
          </h3>
        </Link>

        <p className="mb-4 line-clamp-1 text-sm text-muted-foreground sm:text-base">
          {property.address}, {property.state} {property.zipCode}
        </p>

        {(() => {
          const priceDisplay = resolvePriceDisplay({
            price: property.price,
            hidePrice: property.hidePrice,
            status: property.status,
            isRental:
              property.status === "for-rent" || property.status === "rented",
          });
          if (priceDisplay.mode === "hidden") return null;
          if (priceDisplay.mode === "consult") {
            return (
              <p className="mb-5 text-2xl font-medium tracking-tight text-foreground">
                A consultar
              </p>
            );
          }
          const isRental =
            property.status === "for-rent" || property.status === "rented";
          const num = Number(property.price);
          return (
            <p className="mb-5 text-2xl font-medium tracking-tight text-foreground">
              {!num || isNaN(num) ? (
                "A consultar"
              ) : (
                <>
                  {formatNumber(num)}€
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

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-4 text-sm text-muted-foreground sm:text-base">
          {!hideRooms && property.bedrooms != null && property.bedrooms > 0 && (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Bed className="h-4 w-4 shrink-0" />
              <span>
                {property.bedrooms}{" "}
                {useEstancias
                  ? (property.bedrooms === 1 ? "Est" : "Ests")
                  : (property.bedrooms === 1 ? "Hab" : "Habs")}
              </span>
            </div>
          )}
          {!hideRooms && property.bathrooms != null && Number(property.bathrooms) > 0 && (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Bath className="h-4 w-4 shrink-0" />
              <span>
                {property.bathrooms}{" "}
                {property.bathrooms === 1 ? "Baño" : "Baños"}
              </span>
            </div>
          )}
          {property.squareFeet > 0 && (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <SquareFoot className="h-4 w-4 shrink-0" />
              <span>{formatNumber(property.squareFeet)} m²</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1 whitespace-nowrap text-xs">
            <Building className="h-3 w-3 shrink-0" />
            <span>Ref: {property.listingId}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
