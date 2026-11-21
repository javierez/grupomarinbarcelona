import type { Metadata } from "next";
import Link from "next/link";
import { searchListings, countListings, getVideoTeaser, type SearchFilters, type SortOption } from "~/server/queries/listings";
import { PropertyCard } from "~/components/listing-card";
import { getProvinces, getSubtypeOptions } from "~/server/queries/search-options";
import { getReferenceTargetPath } from "~/server/queries/reference-target";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { getFeaturesProps, getPropertiesConfig, getVideoFeatures } from "~/server/queries/website-config";
import { priceBandsFrom } from "~/lib/price-bands";
import { isAccount155, ACCOUNT_155_PRICE_BANDS } from "~/lib/account-overrides/155";
import { PriceBandBar } from "~/components/search/price-band-bar";
import { env } from "~/env";
import { PropertyCardSkeleton } from "~/components/property-card-skeleton";
import {
  isSearchSlug,
  legacySaleSlug,
  opcionesBuscador,
  parseSearchSlug,
  SEARCH_PROPERTY_TYPES,
  normalizePropertyTypes,
  type PropertyType,
} from "~/lib/search-utils";
import Footer from "~/components/footer";
import { SearchBar } from "~/components/search-bar";
import { SortDropdown } from "~/components/sort-dropdown";
import { applySortParam } from "~/lib/sort-params";
import { Pagination } from "~/components/pagination";
import { Suspense } from "react";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import BreadcrumbJsonLd from "~/components/breadcrumb-json-ld";
import { FeedViewToggle } from "~/components/propiedades/FeedViewToggle";
import { PropertyFeed } from "~/components/propiedades/PropertyFeed";
import { VideoFeedBanner } from "~/components/video/video-feed-banner";
import { getWatermarkedImageUrl } from "~/lib/image-url";
import { MapViewToggle } from "~/components/propiedades/MapViewToggle";
import { PropertyMap } from "~/components/propiedades/maps/property-map";
import { CityIntro } from "~/components/city/city-intro";
import { CityFaq } from "~/components/city/city-faq";
import FaqJsonLd from "~/components/city/faq-json-ld";
import { getCityContent } from "~/server/queries/city-content";
import { getSiteUrl } from "~/lib/site-url";
import { ogImageEntry } from "~/lib/og-image";
import { getSiteOgImageSource } from "~/server/queries/og-image";
import { metadataDePaginaPropia, paginaPropia } from "~/server/queries/paginas-propias";
import { PaginaPropia } from "~/components/pagina-propia/pagina-propia";

const ITEMS_PER_PAGE = 24;
const MAP_VIEW_LIMIT = 500;

const PROPERTY_TYPE_PLURAL: Record<Exclude<PropertyType, "any">, string> = {
  piso: "Pisos",
  casa: "Casas",
  local: "Locales",
  solar: "Terrenos",
  garaje: "Garajes",
  edificio: "Edificios",
  oficina: "Oficinas",
  industrial: "Naves Industriales",
  trastero: "Trasteros",
};

function buildPropertyTypeTitle(
  types: Exclude<PropertyType, "any">[],
  status: "for-sale" | "for-rent" | "any",
  /** La v1 de El Mito (`v1Inicial`) decía «Solares». */
  solares = false,
): string {
  // "Solar" is sale-only; if it's the only selected type and rent is requested,
  // we still keep the rent suffix to match what the URL expresses.
  // Status "any" (the "todo" slug) spans both operations, so it gets no suffix.
  const suffix =
    status === "any" ? "" : status === "for-rent" ? "en Alquiler" : "en Venta";
  const labels = types.map((t) =>
    solares && t === "solar" ? "Solares" : PROPERTY_TYPE_PLURAL[t],
  );
  let joined: string;
  if (labels.length === 1) {
    joined = labels[0]!;
  } else {
    joined = `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
  }
  return suffix ? `${joined} ${suffix}` : joined;
}

/**
 * Ni página propia ni búsqueda: 404. Con `redirigirRutasAntiguas` (las webs
 * que vienen de la v1, que pintaba esas rutas como una búsqueda de venta), un
 * 301 a esa búsqueda, para que los enlaces viejos de Google no mueran.
 */
async function sinBusqueda(slugString: string): Promise<never> {
  const features = await getFeaturesProps();
  const destino =
    features.redirigirRutasAntiguas === true ? legacySaleSlug(slugString) : null;
  if (destino) permanentRedirect(`/${destino}`);
  notFound();
}

/**
 * La primera v1 (`v1Primera`: 21 y 142) leía «todo» como venta: su /todo es
 * «Propiedades en Venta», no venta y alquiler.
 */
async function parseSlugDeLaWeb(slugString: string) {
  const parsed = parseSearchSlug(slugString);
  if (parsed.status === "any" && (await getFeaturesProps()).v1Primera === true) {
    parsed.status = "for-sale";
  }
  return parsed;
}

// Generate dynamic metadata based on search parameters
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ sort?: string; page?: string; q?: string }>;
}): Promise<Metadata> {
  const unwrappedParams = await params;
  const unwrappedSearchParams = await searchParams;
  const slugString = unwrappedParams.slug.join("/");
  const currentPage = Math.max(1, parseInt(unwrappedSearchParams.page ?? "1", 10) || 1);
  const query = unwrappedSearchParams.q?.trim();

  // Una página de la agencia (features_props.paginas) antes que el 404.
  const propia = await paginaPropia(slugString);
  if (propia) return metadataDePaginaPropia(propia.pagina);
  if (!isSearchSlug(slugString)) await sinBusqueda(slugString);

  // Free-text results are an unbounded URL space — never index them, and don't
  // advertise a canonical that varies per query.
  if (query) {
    return {
      metadataBase: new URL(
        getSiteUrl(),
      ),
      title: `Resultados para «${query}»`,
      description: `Propiedades que coinciden con «${query}».`,
      robots: { index: false, follow: true },
    };
  }

  const parsedParams = await parseSlugDeLaWeb(slugString);
  const {
    location = "",
    status = "for-sale",
    isOportunidad,
    isBankOwned,
    isFeatured,
  } = parsedParams;
  const selectedTypes = normalizePropertyTypes(parsedParams.propertyType);

  // Build title and description based on search parameters
  let title = "Propiedades";
  let description = "Explora nuestras propiedades disponibles.";

  if (status === "for-rent") {
    title = "Propiedades en Alquiler";
    description =
      "Encuentra propiedades en alquiler en las mejores ubicaciones.";
  } else if (status === "for-sale") {
    title = "Propiedades en Venta";
    description =
      "Descubre propiedades en venta que se adaptan a tus necesidades.";
  }

  if (selectedTypes.length > 0) {
    title = buildPropertyTypeTitle(
      selectedTypes,
      status,
      (await getFeaturesProps()).v1Inicial === true,
    );
  }

  // Handle oportunidad filter
  if (isOportunidad) {
    title += " - Oportunidad";
    description = "Descubre nuestras mejores oportunidades inmobiliarias.";
  }

  if (isBankOwned) {
    title += " - Origen Bancario";
    description = "Descubre nuestras propiedades de origen bancario.";
  }

  if (isFeatured) {
    title += " - Destacados";
    description = "Descubre nuestras propiedades destacadas.";
  }

  if (location && location !== "todas-ubicaciones") {
    const locationName = decodeURIComponent(location.replace(/-/g, " "));
    const capitalizedLocationName =
      locationName.charAt(0).toUpperCase() + locationName.slice(1);
    title += ` en ${capitalizedLocationName}`;
    description += ` en ${capitalizedLocationName}.`;
  }

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${slugString}`,
      type: "website",
      images: [ogImageEntry(await getSiteOgImageSource(), title)],
    },
    alternates: {
      canonical: currentPage > 1 ? `/${slugString}?page=${currentPage}` : `/${slugString}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

interface SearchPageProps {
  params: Promise<{
    slug: string[];
  }>;
  searchParams: Promise<{
    sort?: string;
    page?: string;
    vista?: string;
    q?: string;
    /** "1" = only listings with a video (the "Ver en vídeo" banner). */
    video?: string;
  }>;
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  // Join the slug array into a single string
  const unwrappedParams = await params;
  const unwrappedSearchParams = await searchParams;
  const slugString = unwrappedParams.slug.join("/");
  // An agency's own page (features_props.paginas, «/reformas-integrales»).
  const propia = await paginaPropia(slugString);
  if (propia) return <PaginaPropia {...propia} />;
  // Anything else that isn't a search URL is a 404, not "Propiedades en Venta en X".
  if (!isSearchSlug(slugString)) await sinBusqueda(slugString);
  const validSorts: SortOption[] = ["default", "newest", "oldest", "price-asc", "price-desc", "size-asc", "size-desc"];
  // `undefined` cuando el visitante no ha elegido: `searchListings` cae
  // entonces en el orden que la agencia configuró en el CRM. Poner "default"
  // aqui era lo que hacia que esa eleccion no llegara nunca a la web.
  const sort: SortOption | undefined = validSorts.includes(unwrappedSearchParams.sort as SortOption)
    ? (unwrappedSearchParams.sort as SortOption)
    : undefined;
  const isFeedView = unwrappedSearchParams.vista === "feed";
  const isMapView = unwrappedSearchParams.vista === "mapa";
  const videoOnly = unwrappedSearchParams.video === "1";
  const query = unwrappedSearchParams.q?.trim() ?? "";

  // Entrada directa por URL (enlace compartido, recarga): una referencia que
  // resuelve a un único inmueble lleva a su ficha, ya con su slug canónico
  // ("Ref: PA-1023" tal cual se copia de la tarjeta también vale). El buscador
  // del navbar la resuelve antes de navegar (resolveReferencePath): este
  // redirect() durante una navegación del lado del cliente rompe el App Router.
  const referenceTarget = await getReferenceTargetPath(query);
  if (referenceTarget) redirect(referenceTarget);

  // Parse the slug to get search parameters
  const parsedParams = await parseSlugDeLaWeb(slugString);

  // Destructure search parameters
  const {
    location = "",
    cities,
    neighborhoodIds,
    province,
    bedrooms = "any",
    bathrooms = "any",
    status = "for-sale",
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    isOportunidad,
    isBankOwned,
    isFeatured,
    amenities,
    subtypes,
  } = parsedParams;
  const selectedTypes = normalizePropertyTypes(parsedParams.propertyType);

  // Build search filters
  const searchFilters: SearchFilters = {
    location: location || undefined,
    cities: cities && cities.length > 0 ? cities : undefined,
    neighborhoodIds:
      neighborhoodIds && neighborhoodIds.length > 0 ? neighborhoodIds : undefined,
    propertyType: selectedTypes.length > 0 ? selectedTypes : undefined,
    // "any" (the "todo" slug) means no listing-type constraint at all, so a
    // reference lookup finds sales and rentals alike.
    status: status === "any" ? undefined : status,
    q: query || undefined,
    bedrooms: bedrooms === "any" ? undefined : parseInt(bedrooms),
    bathrooms: bathrooms === "any" ? undefined : parseInt(bathrooms),
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    isOportunidad,
    isBankOwned,
    isFeatured,
    // La provincia se leía de la URL pero no llegaba a la consulta: elegir
    // solo provincia no filtraba nada.
    province: province && province !== "all" ? province : undefined,
    amenities: amenities && amenities.length > 0 ? amenities : undefined,
    subtypes: subtypes && subtypes.length > 0 ? subtypes : undefined,
    hasVideo: videoOnly || undefined,
  };

  // Pagination
  const currentPage = Math.max(1, parseInt(unwrappedSearchParams.page ?? "1", 10) || 1);
  // Map view shows every match on the map, so it sidesteps pagination and pulls
  // a larger batch in one go (capped by MAP_VIEW_LIMIT).
  const pageSize = isMapView ? MAP_VIEW_LIMIT : ITEMS_PER_PAGE;
  const offset = isMapView ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;

  // Get data for search bar
  const accountId = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);
  const citySlugForContent =
    location && location !== "todas-ubicaciones" ? location : null;
  // Settings are already loaded by the layout (request-scoped cache), so this
  // resolves immediately; it only decides whether the banner query runs at all.
  const videoFeatures = await getVideoFeatures();
  // "Ver en vídeo": count + posters in one query, in parallel with the page's
  // own queries. Skipped entirely unless the account turned it on.
  const showVideoBanner =
    videoFeatures.resultsBanner && !isFeedView && !isMapView && !videoOnly;
  const videoTeaserPromise = showVideoBanner
    ? getVideoTeaser(searchFilters)
    : Promise.resolve({ count: 0, posters: [] as string[] });
  // Price-only search (features_props.priceBands). Sale pages only: the cuts are
  // sale prices, and a rental page with them would offer bands that never match.
  // Rentals then show no search box at all; the navbar search stays.
  // GO4's cuts are read here, not in getFeaturesProps: the generator replaces
  // that function with the baked DB value, which dropped the override there
  // (first deploy, 11-nov-2026). Same as the 155 navbar pill.
  const features = await getFeaturesProps();
  // v1 look (`aspectoV1`): plain breadcrumbs, a bold title with no kicker.
  const v1 = features.aspectoV1 === true;
  // La rejilla de la v1 de El Mito (`v1Inicial`) no tenía `grid-cols-1`: en
  // móvil un título largo ensancha la tarjeta más allá de la pantalla.
  const bandCuts =
    features.priceBands ?? (isAccount155() ? [...ACCOUNT_155_PRICE_BANDS] : []);
  const priceBands = status === "for-sale" ? priceBandsFrom(bandCuts) : [];
  const usePriceBands = bandCuts.length > 0;
  const withoutPrice = { ...searchFilters, minPrice: undefined, maxPrice: undefined };
  const bandCountsPromise = Promise.all(
    priceBands.length > 0
      ? [
          countListings(withoutPrice),
          ...priceBands.map((b) =>
            countListings({ ...withoutPrice, minPrice: b.minPrice, maxPrice: b.maxPrice }),
          ),
        ]
      : [],
  );
  const [provinces, subtypeOptions, totalCount, listings, watermarkConfig, cityContent, propertiesConfig] = await Promise.all([
    getProvinces(accountId),
    getSubtypeOptions(accountId),
    countListings(searchFilters),
    searchListings(searchFilters, pageSize, sort, offset),
    getWatermarkConfig(),
    citySlugForContent ? getCityContent(citySlugForContent) : Promise.resolve(null),
    getPropertiesConfig(),
  ]);
  const videoTeaser = await videoTeaserPromise;
  const [anyPriceCount = 0, ...bandCounts] = await bandCountsPromise;
  const videoCount = videoTeaser.count;
  // Lo que marca el desplegable: la eleccion del visitante o, si no la hay, la
  // de la agencia — la misma que acaba de aplicar la consulta.
  const activeSort: SortOption = sort ?? propertiesConfig.defaultSort;
  const showDescription = propertiesConfig.showDescription !== false;
  const showReference = propertiesConfig.showReference !== false;

  // Only surface intro + FAQ on the first page, to keep paginated pages distinct
  // without duplicating the hero content (Google indexes ?page=2 separately).
  const showCityContent = cityContent && currentPage === 1;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // 404 for invalid page numbers (skipped in map view — map shows all matches at once)
  if (!isMapView && currentPage > totalPages && totalPages > 0) {
    notFound();
  }

  const watermarkEnabled = watermarkConfig.enabled && !!watermarkConfig.logoUrl;

  // Misma lista que el formulario de la home (ver SEARCH_PROPERTY_TYPES).
  const propertyTypes = SEARCH_PROPERTY_TYPES;

  // Build title of the search
  let searchTitle = "Propiedades";

  if (status === "for-rent") {
    searchTitle = "Propiedades en Alquiler";
  } else if (status === "for-sale") {
    searchTitle = "Propiedades en Venta";
  }

  if (selectedTypes.length > 0) {
    searchTitle = buildPropertyTypeTitle(
      selectedTypes,
      status,
      features.v1Inicial === true,
    );
  }

  // Add "Oportunidad" suffix if filtering by oportunidad
  if (isOportunidad) {
    searchTitle += " - Oportunidad";
  }

  if (isBankOwned) {
    searchTitle += " - Origen Bancario";
  }

  if (isFeatured) {
    searchTitle += " - Destacados";
  }

  let capitalizedCityName: string | null = null;
  if (location && location !== "todas-ubicaciones") {
    const locationName = decodeURIComponent(location.replace(/-/g, " "));
    capitalizedCityName =
      locationName.charAt(0).toUpperCase() + locationName.slice(1);
    searchTitle += ` en ${capitalizedCityName}`;
  }

  // A free-text search owns the heading — the slug facets are incidental here.
  if (query) {
    searchTitle = `Resultados para «${query}»`;
  }

  return (
    <>
      <BreadcrumbJsonLd
        siteUrl={getSiteUrl()}
        items={[
          { name: "Inicio", href: "/" },
          { name: searchTitle, href: `/${slugString}` },
        ]}
      />
      {/* prev/next are crawler pagination hints. Free-text result pages are
          noindex and their URLs carry ?q=, which these tags would drop —
          pointing crawlers at a different result set. Omit them while searching. */}
      {!query && currentPage > 1 && (
        <link
          rel="prev"
          href={currentPage === 2 ? `/${slugString}` : `/${slugString}?page=${currentPage - 1}`}
        />
      )}
      {!query && currentPage < totalPages && (
        <link rel="next" href={`/${slugString}?page=${currentPage + 1}`} />
      )}
    <main className="min-h-screen bg-background">
      <div className={v1 ? "container mx-auto px-4 py-8" : "container mx-auto px-4 py-12 sm:py-16"}>
        {/* Breadcrumb */}
        <nav className={v1 ? "py-4" : "mb-8"} aria-label="Breadcrumb">
          <ol className={v1 ? "flex items-center text-sm" : "flex items-center text-xs font-medium uppercase tracking-eyebrow"}>
            <li>
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Inicio
              </Link>
            </li>
            <li className={v1 ? "mx-2" : "mx-3 text-muted-foreground/50"}>/</li>
            <li className={v1 ? "font-medium" : "text-foreground"} aria-current="page">
              {searchTitle}
            </li>
          </ol>
        </nav>

        {priceBands.length > 0 ? (
          <div className="mb-12">
            <PriceBandBar
              bands={priceBands.map((b, i) => ({ ...b, count: bandCounts[i] ?? 0 }))}
              totalCount={anyPriceCount}
              initialParams={parsedParams}
            />
          </div>
        ) : !(usePriceBands && status === "for-rent") ? (
          <div className={v1 ? "mb-8 mt-8" : "mb-12"}>
            <SearchBar
              initialParams={parsedParams}
              provinces={provinces}
              propertyTypes={propertyTypes}
              subtypeOptions={subtypeOptions}
              query={query || undefined}
              opciones={opcionesBuscador(features)}
            />
          </div>
        ) : null}

        <div className={v1 ? "mb-8 space-y-3" : "mb-12 space-y-4"}>
          <div className={v1 ? "flex flex-wrap items-center justify-between gap-3" : "flex flex-wrap items-end justify-between gap-3"}>
            {v1 ? (
              <h1 className="text-3xl font-bold">{searchTitle}</h1>
            ) : (
              <div>
                <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                  Resultados de búsqueda
                </span>
                <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">{searchTitle}</h1>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapViewToggle
                slugString={slugString}
                currentSort={activeSort}
                defaultSort={propertiesConfig.defaultSort}
                query={query || undefined}
                isMapView={isMapView}
              />
              {!isMapView && (
                <FeedViewToggle
                  slugString={slugString}
                  currentSort={activeSort}
                  defaultSort={propertiesConfig.defaultSort}
                  query={query || undefined}
                  currentPage={currentPage}
                />
              )}
              {!isMapView && (
                <SortDropdown
                  slugString={slugString}
                  currentSort={activeSort}
                  defaultSort={propertiesConfig.defaultSort}
                  query={query || undefined}
                />
              )}
            </div>
          </div>
          <p className={v1 ? "hidden text-muted-foreground sm:block" : "hidden text-sm text-muted-foreground sm:block"}>
            {totalCount} propiedades encontradas
            {!isMapView && totalPages > 1 && ` — Página ${currentPage} de ${totalPages}`}
            {isMapView && totalCount > MAP_VIEW_LIMIT &&
              ` — mostrando las primeras ${MAP_VIEW_LIMIT} en el mapa`}
          </p>
        </div>

        {showCityContent && cityContent && capitalizedCityName && (
          <CityIntro city={capitalizedCityName} intro={cityContent.intro} />
        )}

        {videoCount > 0 && (
          <VideoFeedBanner
            href={(() => {
              const params = new URLSearchParams();
              if (query) params.set("q", query);
              applySortParam(params, activeSort, propertiesConfig.defaultSort);
              params.set("vista", "feed");
              params.set("video", "1");
              return `/${slugString}?${params.toString()}`;
            })()}
            count={videoCount}
            posters={videoTeaser.posters.map((url) =>
              getWatermarkedImageUrl(url, watermarkEnabled),
            )}
          />
        )}

        <h2 className="sr-only">Listado de propiedades</h2>

        {isMapView ? (
          <PropertyMap listings={listings} watermarkEnabled={watermarkEnabled} />
        ) : (
          <>
            {listings.length === 0 && features.v1Primera === true ? null : listings.length === 0 ? (
              // La primera v1 (`v1Primera`) no avisaba: la rejilla se quedaba vacía.
              <div className="rounded-lg border border-dashed py-16 text-center">
                <p className="text-lg font-medium">
                  {query
                    ? `No encontramos resultados para «${query}»`
                    : "No encontramos propiedades con estos filtros"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {query
                    ? "Revisa la referencia o prueba con menos palabras — por ejemplo, solo la calle o la ciudad."
                    : "Prueba a ampliar la búsqueda."}
                </p>
                <Link
                  href="/venta/todas-ubicaciones"
                  className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Ver todas las propiedades
                </Link>
              </div>
            ) : (
              <div className={v1 ? `grid ${features.v1Inicial === true ? "" : "grid-cols-1 "}gap-6 md:grid-cols-2 lg:grid-cols-3` : "grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10"}>
                <Suspense
                  fallback={Array.from({ length: 6 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} />
                  ))}
                >
                  {listings.map((listing, index) => (
                    <PropertyCard
                      key={listing.listingId.toString()}
                      listing={listing}
                      index={index}
                      watermarkEnabled={watermarkEnabled}
                      showDescription={showDescription}
                      showReference={showReference}
                      cardDisplay={propertiesConfig.cardDisplay}
                      video={{ badge: videoFeatures.cardBadge, preview: videoFeatures.cardPreview }}
                    />
                  ))}
                </Suspense>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              slugString={slugString}
              currentSort={activeSort}
              defaultSort={propertiesConfig.defaultSort}
              extraParams={query ? { q: query } : undefined}
              v1={v1}
            />
          </>
        )}

        {showCityContent && cityContent && capitalizedCityName && (
          <>
            <CityFaq city={capitalizedCityName} faq={cityContent.faq} />
            <FaqJsonLd faq={cityContent.faq} />
          </>
        )}

        {isFeedView && (
          <PropertyFeed
            listings={listings}
            watermarkEnabled={watermarkEnabled}
            slugString={slugString}
            currentSort={activeSort}
            defaultSort={propertiesConfig.defaultSort}
            query={query || undefined}
            video={videoFeatures}
          />
        )}
      </div>
      <Footer />
    </main>
    </>
  );
}
