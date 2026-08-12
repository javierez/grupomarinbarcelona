"use client";

import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useIsMobile } from "~/components/hooks/use-mobile";

interface FeedViewToggleProps {
  slugString: string;
  currentSort: string;
  /** Active free-text query, carried across so the view toggle keeps it. */
  query?: string;
}

export function FeedViewToggle({ slugString, currentSort, query }: FeedViewToggleProps) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("vista", "feed");
  if (currentSort && currentSort !== "default") {
    params.set("sort", currentSort);
  }

  return (
    <Button variant="outline" size="sm" className="h-10 rounded-full border-border/60 px-5 text-sm font-normal" asChild>
      <Link href={`/${slugString}?${params.toString()}`}>
        <Smartphone className="mr-2 h-4 w-4" />
        Explorar
      </Link>
    </Button>
  );
}
