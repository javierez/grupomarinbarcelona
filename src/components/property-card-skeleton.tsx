import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 bg-transparent shadow-none">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Skeleton className="h-full w-full" />
      </div>

      <CardContent className="px-6 py-7">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>

        <Skeleton className="mb-3 h-6 w-3/4" />
        <Skeleton className="mb-4 h-4 w-full" />
        <Skeleton className="mb-5 h-8 w-1/3" />

        <div className="flex items-center gap-4 border-t border-border/60 pt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
