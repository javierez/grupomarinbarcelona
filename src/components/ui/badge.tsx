"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { useAspectoV1 } from "~/components/header-style-context";
import { cn } from "~/lib/utils";

// La de las webs v1 (`aspectoV1`), clase a clase.
const BADGE_V1 =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
const BADGE_V2 =
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

const badgeVariants = cva("", 
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand text-brand-foreground hover:bg-brand/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const v1 = useAspectoV1();
  return (
    <div className={cn(v1 ? BADGE_V1 : BADGE_V2, badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
