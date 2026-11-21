import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getListingDetails,
  getPropertyImages,
  getPropertyMedia,
} from "~/server/queries/listings";
import { getAccountInfo, getAccountContact } from "~/server/queries/account";
import { getLogo } from "~/server/queries/logo";
import { env } from "~/env";
import { getBankOwnedLabel } from "~/lib/data";
import {
  buildPropertySlug,
  parsePropertySlug,
  buildPropertyImageAlt,
  buildPropertyDisplayTitle,
  buildVisibilityAwareTitle,
  type VisibilityTitleInput,
} from "~/lib/property-slug";
import { isAccount139 } from "~/lib/account-overrides/139";
import { isAccount137 } from "~/lib/account-overrides/137";
import { Account137Summary } from "~/components/property/account-137-summary";
import { Badge } from "~/components/ui/badge";
import { Bed, Bath, SquareIcon, MapPin } from "lucide-react";
import { PropertyCard } from "~/components/property-card";
import { ContactSection } from "~/components/contact-section";
import Footer from "~/components/footer";
import { ImageGallery } from "~/components/property/image-gallery";
import { PropertyVideoFeature } from "~/components/video/property-video-feature";
import { PropertyCharacteristics } from "~/components/property/property-characteristics";
import { PropertyLocationMap } from "~/components/property/property-location-map";
import { PropertyPageClient } from "./property-page-client";
import BreadcrumbJsonLd from "~/components/breadcrumb-json-ld";
import PropertyJsonLd from "~/components/property-json-ld";
import { EnergyCertificateSection } from "~/components/property/energy-certificate-section";
import { PropertyMedia } from "~/components/property/property-media";
import { PropertyPlanos } from "~/components/property/property-planos";
import { PromotionDocuments } from "~/components/promociones/PromotionDocuments";
import { getPromotionDocumentsForListing } from "~/server/queries/promotions";
import { buildSearchSlug } from "~/lib/search-utils";
import { cn, formatNumber, formatPrice, resolvePriceDisplay } from "~/lib/utils";
import {
  getFeaturesProps,
  getVideoFeatures,
  getPropertiesConfig,
} from "~/server/queries/website-config";
import { buildLocationLabel } from "~/lib/card-display";
import { descriptionAlignClass } from "~/lib/description-align";
import { isRentalListingType, listingStatusLabel } from "~/lib/listing-types";
import { roomsNoun, showsRooms } from "~/lib/property-rooms";
import { publicPostalCode, toPublicDetailLocation } from "~/lib/location-privacy";
import { fichaPublica } from "~/lib/ficha-publica";
import { getSiteUrl } from "~/lib/site-url";
import { ogImageEntry } from "~/lib/og-image";

interface PropertyPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Property-detail H1 / metadata title. Account 139 hides the exact location: the
 * title adapts to the listing's `visibilityMode` (1=Exact street+number,
 * 2=Street, 3=Zone → "Tipo en Municipio, Barrio"). Other accounts keep their
 * stored marketing title.
 */
function resolvePropertyTitle(property: any): string {
  if (isAccount139()) {
    return buildVisibilityAwareTitle({
      propertyType: property.propertyType,
      propertySubtype: property.propertySubtype,
      street: property.street,
      municipality: property.municipality,
      neighborhood: property.neighborhood,
      subneighborhood: property.subneighborhood,
      city: property.city,
      visibilityMode: property.visibilityMode,
    } satisfies VisibilityTitleInput);
  }
  return buildPropertyDisplayTitle({
    title: property.title,
    propertyType: property.propertyType,
    propertySubtype: property.propertySubtype,
    neighborhood: property.neighborhood,
    municipality: property.municipality,
    city: property.city,
  });
}

export async function generateMetadata({
  params,
}: PropertyPageProps): Promise<Metadata> {
  const unwrappedParams = await params;
  const parsed = parsePropertySlug(unwrappedParams.id);

  let property = null;
  let propertyImages = [];

  if (parsed) {
    try {
      const details = await getListingDetails(parsed.id);
      property = details ? toPublicDetailLocation(details) : null;
      if (property) {
        propertyImages = await getPropertyImages(property.propertyId);
      }
    } catch (error) {
      console.error("Error fetching property for metadata:", error);
    }
  }

  // Fetch website configuration from database
  const accountInfo = await getAccountInfo(env.NEXT_PUBLIC_ACCOUNT_ID);
  const companyName = accountInfo?.name || "Inmobiliaria";

  if (!property) {
    return {
      // absolute: the layout's "%s | <marca>" template would add the name twice.
      title: { absolute: `Propiedad no encontrada | ${companyName}` },
      description:
        "La propiedad que estás buscando no existe o ha sido eliminada.",
    };
  }

  const baseUrl = getSiteUrl();
  const canonicalSlug = buildPropertySlug({
    listingId: property.listingId,
    title: property.title,
    propertyType: property.propertyType,
    propertySubtype: property.propertySubtype,
    city: property.city,
    bedrooms: property.bedrooms,
    listingType: property.listingType,
  });
  const displayTitle = resolvePropertyTitle(property);

  return {
    title: { absolute: `${displayTitle} | ${companyName}` },
    description: property.description || `Propiedad en ${property.city}`,
    alternates: {
      canonical: `${baseUrl}/propiedades/${canonicalSlug}`,
    },
    openGraph: {
      title: `${displayTitle} | ${companyName}`,
      description: property.description || `Propiedad en ${property.city}`,
      url: `${baseUrl}/propiedades/${canonicalSlug}`,
      type: "website",
      images: [
        ogImageEntry(propertyImages[0]?.imageUrl, displayTitle),
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayTitle} | ${companyName}`,
      description: property.description || `Propiedad en ${property.city}`,
      images: [ogImageEntry(propertyImages[0]?.imageUrl, displayTitle)],
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const unwrappedParams = await params;
  const parsed = parsePropertySlug(unwrappedParams.id);

  if (!parsed) {
    notFound();
  }

  let property = null;
  let propertyImages = [];
  let propertyMediaData = { videos: [] as { id: string; url: string }[], youtubeLinks: [] as { id: string; url: string }[], virtualTours: [] as { id: string; url: string }[] };
  // Los PDFs del edificio, cuando esta unidad cuelga de una promoción.
  let promotionDocs: Awaited<
    ReturnType<typeof getPromotionDocumentsForListing>
  > = null;

  try {
    // Calle y coordenadas recortadas según la visibilidad del anuncio ANTES de
    // usarlas: de aquí salen los props de los componentes de cliente, el
    // JSON-LD, el mapa y el enlace a Google Maps, todo visible en el código de
    // la página (ver ~/lib/location-privacy).
    const details = await getListingDetails(parsed.id);
    property = details ? toPublicDetailLocation(details) : null;
    if (property) {
      [propertyImages, propertyMediaData, promotionDocs] = await Promise.all([
        getPropertyImages(property.propertyId),
        getPropertyMedia(property.propertyId),
        getPromotionDocumentsForListing(parsed.id),
      ]);
    }
  } catch (error) {
    console.error("Error fetching property:", error);
    notFound();
  }

  const accountInfo = await getAccountInfo(env.NEXT_PUBLIC_ACCOUNT_ID);
  const siteFeatures = await getFeaturesProps();
  // v1 look (`aspectoV1`, docs/v1-a-v2.md §3).
  const v1 = siteFeatures.aspectoV1 === true;
  // `v1Antigua` (21, 122, 142): their counts were the number alone, no noun.
  const sinNombre = v1 && siteFeatures.v1Antigua === true;
  // Agency contact + logo for the "Cuenta" variant of the contact card (shown
  // when the listing's useAgentPhone toggle is off).
  const [agencyContact, agencyLogo] = await Promise.all([
    getAccountContact(env.NEXT_PUBLIC_ACCOUNT_ID),
    getLogo(),
  ]);
  // v1's office card (`fichaTarjetaOficina`) carries the full name, as v1 did
  // («Inmobiliaria Acrópolis», not the short «Acrópolis»).
  const tarjetaOficina = siteFeatures.fichaTarjetaOficina === true;
  const fullName = tarjetaOficina ? accountInfo?.name?.trim() : undefined;
  const agency = agencyContact
    ? { ...agencyContact, name: fullName ? fullName : agencyContact.name, logo: agencyLogo }
    : null;
  const propertiesConfig = await getPropertiesConfig();
  // La v1 justifica la descripción si la agencia no ha elegido otra cosa.
  const descriptionAlignCls =
    descriptionAlignClass(siteFeatures.descriptionAlign) ||
    (siteFeatures.aspectoV1 === true ? "text-justify" : "");

  if (!property) {
    notFound();
  }

  const displayTitle = resolvePropertyTitle(property);
  // Lo único del anuncio que llega al navegador (ver ~/lib/ficha-publica).
  const ficha = fichaPublica(property, { hayOficina: agency !== null });
  // Ana Díaz (137): its own header under the gallery (Ir al buscador, action
  // bar, zona · ref · precio · €/m², características). Ported from v1.
  const acct137 = isAccount137();

  // Location label follows the same rule as the property cards
  // (city › configured field, with neighborhood → municipality → province fallback).
  // `fichaDireccion`: as v1, the trimmed street + postcode (getFormattedAddress)
  // instead of «Ciudad, barrio».
  const locationLabel =
    siteFeatures.fichaDireccion === true
      ? ""
      : buildLocationLabel(property, propertiesConfig.cardDisplay.cardLocationField);

  // 301-redirect to the canonical slug URL if the requested slug doesn't match.
  // This covers legacy numeric IDs and any stale/altered slugs indexed by search engines.
  const canonicalSlug = buildPropertySlug({
    listingId: property.listingId,
    title: property.title,
    propertyType: property.propertyType,
    propertySubtype: property.propertySubtype,
    city: property.city,
    bedrooms: property.bedrooms,
    listingType: property.listingType,
  });
  if (parsed.raw !== canonicalSlug) {
    permanentRedirect(`/propiedades/${canonicalSlug}`);
  }

  // Transform database images to PropertyImage format, with videos first
  const baseAlt = buildPropertyImageAlt({
    title: property.title,
    propertyType: property.propertyType,
    propertySubtype: property.propertySubtype,
    city: property.city,
    bedrooms: property.bedrooms,
    squareMeter: property.squareMeter,
    listingType: property.listingType,
  });

  const videoSlides = propertyMediaData.videos.map((v) => ({
    id: v.id,
    url: v.url,
    alt: `${baseAlt} - Vídeo`,
    tag: "video" as const,
    originImageId: null,
  }));

  // Planos (floor plans) are property_images tagged "plano". Pull them out of
  // the photo gallery and surface them in their own section (PDF → iframe,
  // image → downloadable preview).
  const planoImages = propertyImages.filter(
    (img: any) => img.imageTag === "plano",
  );
  const galleryImages = propertyImages.filter(
    (img: any) => img.imageTag !== "plano",
  );

  const imageSlides = galleryImages.map((img: any) => ({
    id: img.propertyImageId,
    url: img.imageUrl,
    alt: `${baseAlt} - Foto ${img.imageOrder}`,
    tag: img.imageTag || undefined,
    originImageId: img.originImageId || null,
    fallbackUrl: img.originalImageUrl !== img.imageUrl ? img.originalImageUrl : undefined,
    thumbUrl: img.thumbUrl || null,
    medUrl: img.medUrl || null,
    fullUrl: img.fullUrl || null,
  }));

  const planos = planoImages.map((img: any) => ({
    id: img.propertyImageId.toString(),
    url: img.fullUrl || img.medUrl || img.imageUrl,
  }));

  const transformedImages = [...videoSlides, ...imageSlides];
  // "featured" layout: the first video leaves the gallery for its own column.
  // Default ("gallery") keeps it as the gallery's first slide.
  const featuredVideo =
    (await getVideoFeatures()).propertyLayout === "featured"
      ? (videoSlides[0] ?? null)
      : null;

  // Create features array from database fields
  const features = [];
  if (property.hasElevator) features.push("Ascensor");
  if (property.hasGarage) features.push("Garaje");
  if (property.hasStorageRoom) features.push("Trastero");
  if (property.hasHeating) features.push("Calefacción");
  if (property.airConditioningType) features.push("Aire acondicionado");
  if (property.terrace) features.push("Terraza");
  if (property.garden) features.push("Jardín");
  if (property.pool) features.push("Piscina");
  if (property.bright) features.push("Luminoso");
  if (property.exterior) features.push("Exterior");

  // Get similar properties (same city or type) - for now just return empty array
  // TODO: Implement similar properties query
  const similarProperties: any[] = [];

  // Map coordinates from database or default to center of Spain
  const mapCoordinates = {
    lat: Number(property.latitude) || 40.4168,
    lng: Number(property.longitude) || -3.7038,
  };

  // Format address based on location visibility setting
  // 1 = Exact (full address), 2 = Street (no number), 3 = Zone (no street).
  // La calle ya llega recortada y `fcLocationVisibility` ya es la efectiva (la
  // más privada de la web y de portales, ver toPublicDetailLocation); el
  // código postal, con la misma regla que el JSON-LD.
  const getFormattedAddress = () => {
    // Avoid duplicating city and province when they are the same (e.g., "León, León")
    const province = property.province !== property.city ? property.province : null;
    return [
      property.street,
      property.city,
      province,
      publicPostalCode(property.postalCode, property.fcLocationVisibility),
    ]
      .filter(Boolean)
      .join(", ");
  };

  // La ubicación y el precio de la cabecera, en los dos diseños.
  const headerLocation = (() => {
    const address = getFormattedAddress();
    const hasStreet =
      !!property.street &&
      (property.fcLocationVisibility ?? 1) !== 3;
    const query = hasStreet
      ? address
      : property.latitude && property.longitude
        ? `${property.latitude},${property.longitude}`
        : address;
    return (
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-foreground hover:underline"
      >
        {locationLabel || address}
      </a>
    );
  })();
  const headerPrice = (() => {
    const isRental = isRentalListingType(property.listingType);
    const priceDisplay = resolvePriceDisplay({
      price: property.price,
      hidePrice: property.hidePrice,
      status: property.status,
      isRental,
    });
    if (priceDisplay.mode === "hidden") return null;
    const num = Number(property.price);
    if (priceDisplay.mode === "consult" || !num || isNaN(num)) return "A consultar";
    return (
      <>
        {formatPrice(num)}€
        {isRental && (
          <span className="text-base font-normal text-muted-foreground">/mes</span>
        )}
      </>
    );
  })();

  return (
    <>
      <BreadcrumbJsonLd
        siteUrl={getSiteUrl()}
        items={[
          { name: "Inicio", href: "/" },
          { name: "Propiedades", href: "/" },
          { name: displayTitle, href: `/propiedades/${canonicalSlug}` },
        ]}
      />
      <PropertyJsonLd
        property={property}
        images={propertyImages}
        companyName={accountInfo?.name || "Inmobiliaria"}
        siteUrl={getSiteUrl()}
      />
      <main
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        data-vesta="ficha"
        data-vesta-id={String(property.listingId)}
      >
        {/* Breadcrumb */}
        <nav className={v1 ? "mt-2 py-4" : "pt-8 pb-4"} aria-label="Breadcrumb">
          <ol className={v1 ? "flex items-center text-sm" : "flex flex-wrap items-center text-xs font-medium uppercase tracking-eyebrow"}>
            <li>
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Inicio
              </Link>
            </li>
            <li className={v1 ? "mx-2" : "mx-3 text-muted-foreground/50"}>/</li>
            <li>
              <Link
                href={v1 ? "/" : "/venta-propiedades/todas-ubicaciones"}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Propiedades
              </Link>
            </li>
            <li className={v1 ? "mx-2" : "mx-3 text-muted-foreground/50"}>/</li>
            <li className={v1 ? "font-medium" : "text-foreground"} aria-current="page">
              {displayTitle}
            </li>
          </ol>
        </nav>

        {/* Encabezado de la propiedad (137 lleva el suyo bajo la galería).
            Con `aspectoV1`, el de la v1: título en negrita, ubicación y
            referencia debajo, y a la derecha el precio con la operación. */}
        {!acct137 && v1 && (
          <article className="py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold" data-vesta="ficha.titulo">
                  {displayTitle}
                </h1>
                <div className="mt-2 flex items-center text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" />
                  {headerLocation}
                </div>
                {/* Como la v1: en el móvil, del tamaño del precio. */}
                <div className="mt-1 text-3xl text-muted-foreground sm:text-sm">
                  Ref: {property.idealistaReference?.trim() || property.listingId || "N/A"}
                </div>
              </div>
              <div className="flex flex-col md:items-end">
                {headerPrice !== null && (
                  <div className="text-3xl font-bold" data-vesta="ficha.precio">
                    {headerPrice}
                  </div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    className={`normal-case tracking-normal ${
                      listingStatusLabel(property) === "Reservado"
                        ? "bg-amber-500 text-white hover:bg-amber-500"
                        : ""
                    }`}
                  >
                    {listingStatusLabel(property)}
                  </Badge>
                  {!!property.isBankOwned && (
                    <Badge
                      variant="outline"
                      className="border-0 bg-amber-50/80 normal-case tracking-normal text-amber-800 shadow-md backdrop-blur-sm"
                    >
                      {getBankOwnedLabel(property.propertyType)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </article>
        )}
        {!acct137 && !v1 && (
        <article className="py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge
                  className={
                    listingStatusLabel(property) === "Reservado"
                      ? "bg-amber-500 text-white hover:bg-amber-500"
                      : undefined
                  }
                >
                  {listingStatusLabel(property)}
                </Badge>
                {!!property.isBankOwned && (
                  <Badge
                    variant="outline"
                    className="border-0 bg-amber-50/95 text-amber-900 backdrop-blur-sm"
                  >
                    {getBankOwnedLabel(property.propertyType)}
                  </Badge>
                )}
              </div>
              <h1
                className="text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl"
                data-vesta="ficha.titulo"
              >
                {displayTitle}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base text-muted-foreground">
                <span className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                  {headerLocation}
                </span>
                <span aria-hidden="true" className="text-muted-foreground/40">
                  ·
                </span>
                <span className="text-xs font-medium uppercase tracking-eyebrow">
                  Ref: {property.idealistaReference?.trim() || property.listingId || "N/A"}
                </span>
              </div>
            </div>
            <div className="flex flex-col md:items-end">
              {headerPrice !== null && (
                <>
                  <span className="mb-2 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Precio
                  </span>
                  <div
                    className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl"
                    data-vesta="ficha.precio"
                  >
                    {headerPrice}
                  </div>
                </>
              )}
            </div>
          </div>
        </article>
        )}

        {/* Galería de imágenes. The ids are anchors for 137's action bar. */}
        <div id="prop-fotos" className="scroll-mt-24 pb-8" data-vesta="ficha.fotos">
          {featuredVideo ? (
            <PropertyVideoFeature
              videoUrl={featuredVideo.url}
              poster={imageSlides[0]?.medUrl ?? imageSlides[0]?.url}
              photoCount={imageSlides.length}
            >
              {/* The other videos, if any, stay in the gallery. */}
              <ImageGallery images={transformedImages.slice(1)} title={displayTitle} />
            </PropertyVideoFeature>
          ) : (
            <ImageGallery images={transformedImages} title={displayTitle} />
          )}
        </div>

        {acct137 &&
          (() => {
            const address = getFormattedAddress();
            const hasStreet =
              !!property.street && (property.fcLocationVisibility ?? 1) !== 3;
            const mapsQuery = hasStreet
              ? address
              : property.latitude && property.longitude
                ? `${property.latitude},${property.longitude}`
                : address;
            const isRental = isRentalListingType(property.listingType);
            const priceNum = Number(property.price);
            const validPrice = !!priceNum && !isNaN(priceNum);
            const priceDisplay = resolvePriceDisplay({
              price: property.price,
              hidePrice: property.hidePrice,
              status: property.status,
              isRental,
            });
            const sqm = Number(property.squareMeter) || 0;
            const roomsApply = showsRooms(
              property.propertyType,
              property.propertySubtype,
            );
            const hasYoutube = propertyMediaData.youtubeLinks.length > 0;
            return (
              <div className="pb-8">
                <Account137Summary
                  title={displayTitle}
                  address={locationLabel || address}
                  mapsQuery={mapsQuery}
                  reference={
                    property.idealistaReference?.trim() ||
                    String(property.listingId ?? "")
                  }
                  priceLabel={
                    priceDisplay.mode === "hidden" ? null : priceDisplay.text
                  }
                  // Hidden price → no €/m² either (€/m² × m² = price).
                  pricePerM2Label={
                    validPrice && !isRental && sqm > 0 && !property.hidePrice
                      ? `${formatPrice(Math.round(priceNum / sqm))}€`
                      : null
                  }
                  statusLabel={listingStatusLabel(property)}
                  bedrooms={roomsApply ? Number(property.bedrooms) || 0 : 0}
                  bathrooms={
                    roomsApply ? Math.floor(Number(property.bathrooms) || 0) : 0
                  }
                  squareMeter={sqm}
                  hasPool={!!property.pool}
                  searchHref={`/${buildSearchSlug({ status: "for-sale" })}`}
                  fotosAnchor="prop-fotos"
                  mapaAnchor="prop-mapa"
                  hasTour={propertyMediaData.virtualTours.length > 0}
                  tourAnchor="prop-3d"
                  hasVideo={hasYoutube || !!featuredVideo}
                  videoAnchor={hasYoutube ? "prop-video" : "prop-fotos"}
                />
              </div>
            );
          })()}

        {/* Videos, YouTube, Virtual Tours */}
        <div className="pb-8">
          <PropertyMedia
            videos={[]}
            youtubeLinks={propertyMediaData.youtubeLinks}
            virtualTours={propertyMediaData.virtualTours}
          />
        </div>

        {/* Contenido principal */}
        <div className="pb-16">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Columna principal. On mobile the contact card/sidebar moves
                above this block (right under the gallery); on desktop the
                normal left-column / right-sidebar order is restored. */}
            <div className={v1 ? "space-y-8 lg:col-span-2" : "order-2 space-y-8 lg:order-1 lg:col-span-2"}>
              {/* Características principales - Only show if at least one value exists.
                  Mismas reglas que las tarjetas (~/lib/property-rooms): ni una
                  cama en una nave, un garaje o un terreno, y "estancias" en un
                  local. */}
              {(() => {
                // 137 shows these in its summary above.
                if (acct137) return null;
                const roomsApply = showsRooms(
                  property.propertyType,
                  property.propertySubtype,
                );
                const beds = roomsApply ? Number(property.bedrooms) || 0 : 0;
                const baths = roomsApply
                  ? Math.floor(Number(property.bathrooms) || 0)
                  : 0;
                const m2 = Number(property.squareMeter) || 0;
                // Una columna por cifra: un local con baño y m² no deja una
                // tercera casilla gris vacía.
                const cifras = [beds, baths, m2].filter((n) => n > 0).length;
                if (cifras === 0) return null;
                // v1: one grey box, icons over bold figures, labels in plain case.
                const cifra = v1
                  ? {
                      celda: "flex flex-col items-center text-center",
                      icono: "mb-2 h-8 w-8 text-primary",
                      numero: "font-bold",
                      nombre: "text-sm text-muted-foreground",
                    }
                  : {
                      celda: "flex flex-col items-center gap-2 bg-background p-6 text-center",
                      icono: "h-6 w-6 text-foreground/70",
                      numero: "text-2xl font-medium tracking-tight text-foreground",
                      nombre: "text-xs font-medium uppercase tracking-eyebrow text-muted-foreground",
                    };
                return (
                <div
                  className={cn(
                    v1
                      ? "grid grid-cols-3 gap-4 rounded-lg bg-muted p-6"
                      : "grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60",
                    v1
                      ? cifras === 2 ? "grid-cols-2" : cifras === 1 && "grid-cols-1"
                      : cifras === 3 ? "sm:grid-cols-3" : cifras === 2 && "sm:grid-cols-2",
                  )}
                >
                  {beds > 0 && (
                    <div className={cifra.celda}>
                      <Bed className={cifra.icono} />
                      <span className={cifra.numero}>
                        {beds}
                      </span>
                      {!sinNombre && (
                      <span className={cifra.nombre}>
                        {roomsNoun(beds, property.propertyType)}
                      </span>
                      )}
                    </div>
                  )}
                  {baths > 0 && (
                    <div className={cifra.celda}>
                      <Bath className={cifra.icono} />
                      <span className={cifra.numero}>
                        {baths}
                      </span>
                      {!sinNombre && (
                      <span className={cifra.nombre}>
                        {v1 ? (baths === 1 ? "baño" : "baños") : baths === 1 ? "Baño" : "Baños"}
                      </span>
                      )}
                    </div>
                  )}
                  {m2 > 0 && (
                    <div className={cifra.celda}>
                      <SquareIcon className={cifra.icono} />
                      <span className={cifra.numero}>
                        {formatNumber(m2)}
                        {v1 && " m²"}
                      </span>
                      {!v1 && (
                        <span className={cifra.nombre}>
                          Metros cuadrados
                        </span>
                      )}
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Planos - below the rooms/baths/m² block, above the description */}
              <PropertyPlanos planos={planos} />

              {/* Documentación de la promoción (memoria de calidades) — la sube
                  la agencia una vez en la promoción y la heredan sus unidades */}
              <PromotionDocuments
                documents={promotionDocs?.documents}
                promotionName={promotionDocs?.name}
              />

              {/* Descripción - Only show if description exists */}
              {!!property.description && (
                <div data-vesta="ficha.descripcion">
                  {v1 ? (
                    <h2 className="mb-4 text-2xl font-bold">Descripción</h2>
                  ) : (
                    <>
                      <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                        Descripción
                      </span>
                      <h2 className="mb-5 text-2xl font-medium tracking-tight">
                        Sobre esta propiedad
                      </h2>
                    </>
                  )}
                  <p
                    className={cn(
                      v1 ? "whitespace-pre-line text-muted-foreground" : "whitespace-pre-line text-base leading-relaxed text-muted-foreground",
                      descriptionAlignCls,
                    )}
                  >
                    {property.description}
                  </p>
                </div>
              )}

              {/* Características */}
              <PropertyCharacteristics
                property={ficha.caracteristicas}
                layout={siteFeatures.characteristicsLayout ?? "sections"}
                style={siteFeatures.characteristicsStyle ?? "default"}
              />

              {/* Energy Certificate */}
              <EnergyCertificateSection
                energyConsumptionScale={property.energyConsumptionScale}
                energyConsumptionValue={property.energyConsumptionValue}
                emissionsScale={property.emissionsScale}
                emissionsValue={property.emissionsValue}
                propertyType={property.propertyType}
                v1={v1}
              />

              {/* Mapa */}
              <div id="prop-mapa" className="scroll-mt-24">
                {v1 ? (
                  <h2 className="mb-4 text-2xl font-bold">Ubicación</h2>
                ) : (
                  <>
                    <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                      Ubicación
                    </span>
                    <h2 className="mb-5 text-2xl font-medium tracking-tight">
                      En el mapa
                    </h2>
                  </>
                )}
                <div className={v1 ? "aspect-[16/9] w-full overflow-hidden rounded-lg" : "aspect-[16/9] w-full overflow-hidden rounded-lg border border-border/60"}>
                  <PropertyLocationMap
                    lat={mapCoordinates.lat}
                    lng={mapCoordinates.lng}
                    locationVisibility={property.fcLocationVisibility}
                  />
                </div>
              </div>
            </div>

            {/* Barra lateral */}
            <PropertyPageClient
              ficha={ficha.cliente}
              agency={agency}
              logoInvertOnLight={siteFeatures.logoInvertOnLight === true}
              tarjetaOficina={tarjetaOficina}
            />
          </div>
        </div>

        {property.city && (
          <div className={v1 ? "pb-8" : "pb-12"}>
            <Link
              href={`/${buildSearchSlug({
                location: property.city,
                status: isRentalListingType(property.listingType)
                  ? "for-rent"
                  : "for-sale",
              })}`}
              className={
                v1
                  ? "inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  : "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-eyebrow text-foreground transition-colors hover:text-foreground/70"
              }
            >
              Ver más propiedades en {property.city}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {/* Propiedades similares - Only show if there are similar properties */}
        {similarProperties.length > 0 && (
          <section className="py-16" aria-label="Propiedades similares">
            <h2 className={v1 ? "mb-8 text-2xl font-bold" : "mb-8 text-2xl font-medium tracking-tight"}>Propiedades Similares</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {similarProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </section>
        )}
      </main>
      <div className="mx-auto hidden max-w-7xl px-4 sm:px-6 md:block lg:px-8">
        <ContactSection />
      </div>
      <Footer />
    </>
  );
}
