import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { applySortParam } from "~/lib/sort-params";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  slugString: string;
  currentSort: string;
  /** The agency's sort (`properties_props.defaultSort`): the one a link may omit. */
  defaultSort?: string;
  // Extra query params that must survive page navigation (e.g. ?promotion=X).
  // Order is preserved: extras → sort → page.
  extraParams?: Record<string, string>;
  /** `features_props.aspectoV1`: the v1's square outline buttons, no rule above. */
  v1?: boolean;
}

function buildPageUrl(
  slugString: string,
  currentSort: string,
  defaultSort: string,
  page: number,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams();
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) params.set(key, value);
    }
  }
  applySortParam(params, currentSort, defaultSort);
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

export function Pagination({
  currentPage,
  totalPages,
  slugString,
  currentSort,
  defaultSort = "default",
  extraParams,
  v1 = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const paso = v1 ? "outline" : "ghost";
  const pasoClass = v1 ? undefined : "h-10 rounded-full px-4 text-muted-foreground hover:text-foreground";
  const pasoApagado = v1 ? undefined : "h-10 rounded-full px-4 text-muted-foreground/50";

  return (
    <nav aria-label="Paginación" className={v1 ? "mt-12 flex items-center justify-center gap-2" : "mt-16 flex items-center justify-center gap-2 border-t border-border/60 pt-10"}>
      {currentPage > 1 ? (
        <Button variant={paso} size="sm" className={pasoClass} asChild>
          <Link href={buildPageUrl(slugString, currentSort, defaultSort, currentPage - 1, extraParams)}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Link>
        </Button>
      ) : (
        <Button variant={paso} size="sm" className={pasoApagado} disabled>
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
              variant={page === currentPage ? "default" : paso}
              size="sm"
              className={
                v1
                  ? "min-w-[36px]"
                  : page === currentPage
                  ? "h-10 min-w-[40px] rounded-full bg-foreground text-background hover:bg-foreground/90"
                  : "h-10 min-w-[40px] rounded-full text-muted-foreground hover:text-foreground"
              }
              asChild={page !== currentPage}
            >
              {page === currentPage ? (
                <span>{page}</span>
              ) : (
                <Link href={buildPageUrl(slugString, currentSort, defaultSort, page, extraParams)}>
                  {page}
                </Link>
              )}
            </Button>
          ),
        )}
      </div>

      {currentPage < totalPages ? (
        <Button variant={paso} size="sm" className={pasoClass} asChild>
          <Link href={buildPageUrl(slugString, currentSort, defaultSort, currentPage + 1, extraParams)}>
            Siguiente
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      ) : (
        <Button variant={paso} size="sm" className={pasoApagado} disabled>
          Siguiente
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      )}
    </nav>
  );
}
