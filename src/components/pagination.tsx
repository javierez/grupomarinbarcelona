import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  slugString: string;
  currentSort: string;
  // Extra query params that must survive page navigation (e.g. ?promotion=X).
  // Order is preserved: extras → sort → page.
  extraParams?: Record<string, string>;
}

function buildPageUrl(
  slugString: string,
  currentSort: string,
  page: number,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  if (currentSort !== "default") params.set("sort", currentSort);
  if (page > 1) params.set("page", page.toString());
  const qs = params.toString();
  return `/${slugString}${qs ? `?${qs}` : ""}`;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (currentPage > 3) pages.push("ellipsis");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) pages.push("ellipsis");

  pages.push(totalPages);

  return pages;
}

export function Pagination({ currentPage, totalPages, slugString, currentSort, extraParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Paginación" className="mt-16 flex items-center justify-center gap-2 border-t border-border/60 pt-10">
      {currentPage > 1 ? (
        <Button variant="ghost" size="sm" className="h-10 rounded-full px-4 text-muted-foreground hover:text-foreground" asChild>
          <Link href={buildPageUrl(slugString, currentSort, currentPage - 1, extraParams)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Link>
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className="h-10 rounded-full px-4 text-muted-foreground/50" disabled>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Anterior
        </Button>
      )}

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, idx) =>
          page === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "ghost"}
              size="sm"
              className={
                page === currentPage
                  ? "h-10 min-w-[40px] rounded-full bg-foreground text-background hover:bg-foreground/90"
                  : "h-10 min-w-[40px] rounded-full text-muted-foreground hover:text-foreground"
              }
              asChild={page !== currentPage}
            >
              {page === currentPage ? (
                <span>{page}</span>
              ) : (
                <Link href={buildPageUrl(slugString, currentSort, page, extraParams)}>
                  {page}
                </Link>
              )}
            </Button>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <Button variant="ghost" size="sm" className="h-10 rounded-full px-4 text-muted-foreground hover:text-foreground" asChild>
          <Link href={buildPageUrl(slugString, currentSort, currentPage + 1, extraParams)}>
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className="h-10 rounded-full px-4 text-muted-foreground/50" disabled>
          Siguiente
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
