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
import { Badge } from "~/components/ui/badge";
import { Bed, Bath, SquareIcon, MapPin } from "lucide-react";
import { PropertyCard } from "~/components/property-card";
import { ContactSection } from "~/components/contact-section";
import Footer from "~/components/footer";
import { ImageGallery } from "~/components/property/image-gallery";
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
import { cn, resolvePriceDisplay } from "~/lib/utils";
import {
  getFeaturesProps,
  getPropertiesConfig,
} from "~/server/queries/website-config";
import { buildLocationLabel } from "~/lib/card-display";
import { descriptionAlignClass } from "~/lib/description-align";
import { isRentalListingType, listingStatusLabel } from "~/lib/listing-types";
import { roomsNoun, showsRooms } from "~/lib/property-rooms";
import { toPublicDetailLocation } from "~/lib/location-privacy";
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
      title: `Propiedad no encontrada | ${companyName}`,
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
    title: `${displayTitle} | ${companyName}`,
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
  // Agency contact + logo for the "Cuenta" variant of the contact card (shown
  // when the listing's useAgentPhone toggle is off).
  const [agencyContact, agencyLogo] = await Promise.all([
    getAccountContact(env.NEXT_PUBLIC_ACCOUNT_ID),
    getLogo(),
  ]);
  const agency = agencyContact
    ? { ...agencyContact, logo: agencyLogo }
    : null;
  const propertiesConfig = await getPropertiesConfig();
  const descriptionAlignCls = descriptionAlignClass(siteFeatures.descriptionAlign);

  if (!property) {
    notFound();
  }

  const displayTitle = resolvePropertyTitle(property);

  // Location label follows the same rule as the property cards
  // (city › configured field, with neighborhood → municipality → province fallback).
  const locationLabel = buildLocationLabel(
    property,
    propertiesConfig.cardDisplay.cardLocationField,
  );

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
  // más privada de la web y de portales, ver toPublicDetailLocation): aquí
  // solo se decide si va el código postal, que en "zona" acotaría demasiado.
  const getFormattedAddress = () => {
    const visibility = property.fcLocationVisibility ?? 1;
    // Avoid duplicating city and province when they are the same (e.g., "León, León")
    const province = property.province !== property.city ? property.province : null;
    const parts: (string | null | undefined)[] =
      visibility === 3
        ? [property.city, province]
        : [property.street, property.city, province, property.postalCode];
    return parts.filter(Boolean).join(", ");
  };

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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="pt-8 pb-4" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center text-xs font-medium uppercase tracking-eyebrow">
            <li>
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Inicio
              </Link>
            </li>
            <li className="mx-3 text-muted-foreground/50">/</li>
            <li>
              <Link
                href="/venta-propiedades/todas-ubicaciones"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Propiedades
              </Link>
            </li>
            <li className="mx-3 text-muted-foreground/50">/</li>
            <li className="text-foreground" aria-current="page">
              {displayTitle}
            </li>
          </ol>
        </nav>

        {/* Encabezado de la propiedad */}
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
              <h1 className="text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {displayTitle}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-base text-muted-foreground">
                <span className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                  {(() => {
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
                  })()}
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
              {(() => {
                const isRental = isRentalListingType(property.listingType);
                const priceDisplay = resolvePriceDisplay({
                  price: property.price,
                  hidePrice: property.hidePrice,
                  status: property.status,
                  isRental,
                });
                if (priceDisplay.mode === "hidden") return null;
                return (
                  <>
                    <span className="mb-2 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                      Precio
                    </span>
                    <div className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                      {priceDisplay.mode === "consult"
                        ? "A consultar"
                        : (() => {
                            const num = Number(property.price);
                            if (!num || isNaN(num)) return "A consultar";
                            return (
                              <>
                                {num.toLocaleString("es-ES")}€
                                {isRental && (
                                  <span className="text-base font-normal text-muted-foreground">
                                    /mes
                                  </span>
                                )}
                              </>
                            );
                          })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </article>

        {/* Galería de imágenes */}
        <div className="pb-8">
          <ImageGallery images={transformedImages} title={displayTitle} />
        </div>

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
            <div className="order-2 space-y-8 lg:order-1 lg:col-span-2">
              {/* Características principales - Only show if at least one value exists.
                  Mismas reglas que las tarjetas (~/lib/property-rooms): ni una
                  cama en una nave, un garaje o un terreno, y "estancias" en un
                  local. */}
              {(() => {
                const roomsApply = showsRooms(
                  property.propertyType,
                  property.propertySubtype,
                );
                const beds = roomsApply ? Number(property.bedrooms) || 0 : 0;
                const baths = roomsApply
                  ? Math.floor(Number(property.bathrooms) || 0)
                  : 0;
                if (!(beds > 0 || baths > 0 || (property.squareMeter && property.squareMeter > 0))) {
                  return null;
                }
                return (
                <div className="grid gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 sm:grid-cols-3">
                  {beds > 0 && (
                    <div className="flex flex-col items-center gap-2 bg-background p-6 text-center">
                      <Bed className="h-6 w-6 text-foreground/70" />
                      <span className="text-2xl font-medium tracking-tight text-foreground">
                        {beds}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                        {roomsNoun(beds, property.propertyType)}
                      </span>
                    </div>
                  )}
                  {baths > 0 && (
                    <div className="flex flex-col items-center gap-2 bg-background p-6 text-center">
                      <Bath className="h-6 w-6 text-foreground/70" />
                      <span className="text-2xl font-medium tracking-tight text-foreground">
                        {baths}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                        {baths === 1 ? "Baño" : "Baños"}
                      </span>
                    </div>
                  )}
                  {!!property.squareMeter && property.squareMeter > 0 && (
                    <div className="flex flex-col items-center gap-2 bg-background p-6 text-center">
                      <SquareIcon className="h-6 w-6 text-foreground/70" />
                      <span className="text-2xl font-medium tracking-tight text-foreground">
                        {Number(property.squareMeter).toLocaleString("es-ES")}
                      </span>
                      <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                        Metros cuadrados
                      </span>
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
                <div>
                  <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Descripción
                  </span>
                  <h2 className="mb-5 text-2xl font-medium tracking-tight">
                    Sobre esta propiedad
                  </h2>
                  <p className={cn("whitespace-pre-line text-base leading-relaxed text-muted-foreground", descriptionAlignCls)}>
                    {property.description}
                  </p>
                </div>
              )}

              {/* Características */}
              <PropertyCharacteristics
                property={property}
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
              />

              {/* Mapa */}
              <div>
                <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                  Ubicación
                </span>
                <h2 className="mb-5 text-2xl font-medium tracking-tight">
                  En el mapa
                </h2>
                <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-border/60">
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
              property={property}
              agency={agency}
              logoInvertOnLight={siteFeatures.logoInvertOnLight === true}
            />
          </div>
        </div>

        {property.city && (
          <div className="pb-12">
            <Link
              href={`/${buildSearchSlug({
                location: property.city,
                status: isRentalListingType(property.listingType)
                  ? "for-rent"
                  : "for-sale",
              })}`}
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-eyebrow text-foreground transition-colors hover:text-foreground/70"
            >
              Ver más propiedades en {property.city}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {/* Propiedades similares - Only show if there are similar properties */}
        {similarProperties.length > 0 && (
          <section className="py-16" aria-label="Propiedades similares">
            <h2 className="mb-8 text-2xl font-medium tracking-tight">Propiedades Similares</h2>
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
