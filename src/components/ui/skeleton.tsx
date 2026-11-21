"use client";

import type React from "react";
import { useAspectoV1 } from "~/components/header-style-context";
import { cn } from "~/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const v1 = useAspectoV1();
  return (
    <div
      className={cn(v1 ? "animate-pulse rounded-md bg-muted" : "animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  );
}

export { Skeleton };
