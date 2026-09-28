import { PropertyCardSkeleton } from "~/components/property-card-skeleton";
import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        {/* Breadcrumb Skeleton */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <div className="flex items-center text-sm">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mx-3 h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </nav>

        {/* Search Bar Skeleton */}
        <div className="mb-12">
          <Skeleton className="h-32 w-full rounded-2xl sm:h-28" />
        </div>

        {/* Title and Count Skeleton */}
        <div className="mb-12 space-y-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-3/4 max-w-2xl" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Property Cards Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
