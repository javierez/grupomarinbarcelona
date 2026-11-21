"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";
import { useAspectoV1 } from "~/components/header-style-context";

const labelVariants = cva(
  "mb-2 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);
// La de las webs v1: en línea, sin margen ni mayúsculas. En línea pesa: la
// línea del padre (24 px) es la que separa la etiqueta del campo.
const ETIQUETA_V1 =
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => {
  const v1 = useAspectoV1();
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(v1 ? ETIQUETA_V1 : labelVariants(), className)}
      {...props}
    />
  );
});
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
