"use client";

import Link from "next/link";
import { Map as MapIcon, LayoutGrid } from "lucide-react";
import { Button } from "~/components/ui/button";

interface MapViewToggleProps {
  slugString: string;
  currentSort: string;
  isMapView: boolean;
  /** Active free-text query, carried across so the view toggle keeps it. */
  query?: string;
}

export function MapViewToggle({
  slugString,
  currentSort,
  isMapView,
  query: searchQuery,
}: MapViewToggleProps) {
  const params = new URLSearchParams();
  if (searchQuery) params.set("q", searchQuery);
  if (!isMapView) params.set("vista", "mapa");
  if (currentSort && currentSort !== "default") {
    params.set("sort", currentSort);
  }
  const query = params.toString();
  const href = `/${slugString}${query ? `?${query}` : ""}`;
  const Icon = isMapView ? LayoutGrid : MapIcon;
  const label = isMapView ? "Cuadrícula" : "Mapa";

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-10 rounded-full border-border/60 px-5 text-sm font-normal"
      asChild
    >
      <Link href={href} aria-label={isMapView ? "Volver a vista cuadrícula" : "Ver en mapa"}>
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
