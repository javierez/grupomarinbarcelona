"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Button } from "~/components/ui/button";
import { applySortParam } from "~/lib/sort-params";
import { useIsMobile } from "~/components/hooks/use-mobile";
import { useAspectoV1 } from "~/components/header-style-context";

interface FeedViewToggleProps {
  slugString: string;
  currentSort: string;
  /** The agency's sort (`properties_props.defaultSort`): the one a link may omit. */
  defaultSort?: string;
  /** Active free-text query, carried across so the view toggle keeps it. */
  query?: string;
  /** Página actual: "Explorar" en la página 3 abría la 1. */
  currentPage?: number;
}

export function FeedViewToggle({
  slugString,
  currentSort,
  defaultSort = "default",
  query,
  currentPage = 1,
}: FeedViewToggleProps) {
  const isMobile = useIsMobile();
  const v1 = useAspectoV1();
  if (!isMobile) return null;

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("vista", "feed");
  if (currentPage > 1) params.set("page", String(currentPage));
  if (currentSort) applySortParam(params, currentSort, defaultSort);

  return (
    <Button
      variant="outline"
      size="sm"
      // v1: el botón cuadrado de shadcn, no la píldora de v2.
      className={v1 ? undefined : "h-10 rounded-full border-border/60 px-5 text-sm font-normal"}
      asChild
    >
      <Link href={`/${slugString}?${params.toString()}`}>
        <Smartphone className="mr-2 h-4 w-4" />
        Explorar
      </Link>
    </Button>
  );
}
