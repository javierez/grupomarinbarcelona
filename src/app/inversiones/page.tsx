import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  searchListings,
  countListings,
  type SortOption,
} from "~/server/queries/listings";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { getPropertiesConfig } from "~/server/queries/website-config";
import { PropertyCard } from "~/components/listing-card";
import { PropertyCardSkeleton } from "~/components/property-card-skeleton";
import { SortDropdown } from "~/components/sort-dropdown";
import { Pagination } from "~/components/pagination";
import Footer from "~/components/footer";
import BreadcrumbJsonLd from "~/components/breadcrumb-json-ld";

const ITEMS_PER_PAGE = 24;
const PAGE_TITLE = "Inversiones";
const PAGE_SUBTITLE = "Oportunidades destacadas seleccionadas para ti";
const SLUG = "inversiones";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; page?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

  return {
    metadataBase: new URL(siteUrl),
    title: `${PAGE_TITLE} — Propiedades destacadas`,
    description:
      "Explora nuestra selección de propiedades destacadas como oportunidades de inversión.",
    openGraph: {
      title: PAGE_TITLE,
      description: PAGE_SUBTITLE,
      url: `/${SLUG}`,
      type: "website",
    },
    alternates: {
      canonical: currentPage > 1 ? `/${SLUG}?page=${currentPage}` : `/${SLUG}`,
    },
    robots: { index: true, follow: true },
  };
}

interface PageProps {
  searchParams: Promise<{ sort?: string; page?: string }>;
}

export default async function InversionesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const validSorts: SortOption[] = [
    "default",
    "newest",
    "oldest",
    "price-asc",
    "price-desc",
    "size-asc",
    "size-desc",
  ];
  // `undefined` = sin eleccion del visitante -> manda la config de la agencia.
  const sort: SortOption | undefined = validSorts.includes(sp.sort as SortOption)
    ? (sp.sort as SortOption)
    : undefined;
  const currentPage = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const filters = { isFeatured: true, status: "for-sale" as const };

  const [totalCount, listings, watermarkConfig, propertiesConfig] = await Promise.all([
    countListings(filters),
    searchListings(filters, ITEMS_PER_PAGE, sort, offset),
    getWatermarkConfig(),
    getPropertiesConfig(),
  ]);
  const activeSort: SortOption = sort ?? propertiesConfig.defaultSort;
  const showDescription = propertiesConfig.showDescription !== false;
  const showReference = propertiesConfig.showReference !== false;

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) notFound();

  const watermarkEnabled = watermarkConfig.enabled && !!watermarkConfig.logoUrl;

  return (
    <>
      <BreadcrumbJsonLd
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com"}
        items={[
          { name: "Inicio", href: "/" },
          { name: PAGE_TITLE, href: `/${SLUG}` },
        ]}
      />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center text-xs font-medium uppercase tracking-eyebrow">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Inicio
                </Link>
              </li>
              <li className="mx-3 text-muted-foreground/50">/</li>
              <li className="text-foreground" aria-current="page">
                {PAGE_TITLE}
              </li>
            </ol>
          </nav>

          <div className="mb-12 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                  Selección destacada
                </span>
                <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl md:text-5xl">
                  {PAGE_TITLE}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                  {PAGE_SUBTITLE}
                </p>
              </div>
              {totalCount > 0 && (
                <div className="flex items-center gap-2">
                  <SortDropdown slugString={SLUG} currentSort={activeSort} />
                </div>
              )}
            </div>
            {totalCount > 0 && (
              <p className="hidden text-sm text-muted-foreground sm:block">
                {totalCount} propiedades encontradas
                {totalPages > 1 && ` — Página ${currentPage} de ${totalPages}`}
              </p>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-border/60 bg-muted/30 px-6 py-16 text-center">
              <p className="text-base text-muted-foreground">
                No hay propiedades destacadas en este momento.
              </p>
              <Link
                href="/venta-propiedades/todas-ubicaciones"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-eyebrow text-foreground hover:text-foreground/70"
              >
                Ver todas las propiedades en venta
                <span aria-hidden>→</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
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
                    />
                  ))}
                </Suspense>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                slugString={SLUG}
                currentSort={activeSort}
              />
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
