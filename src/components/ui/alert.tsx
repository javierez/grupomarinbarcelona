"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { useAspectoV1 } from "~/components/header-style-context";
import { cn } from "~/lib/utils";

// La de las webs v1 (`aspectoV1`), clase a clase.
const ALERT_V1 =
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground";
const ALERT_V2 =
  "relative w-full rounded-xl border border-border/60 p-5 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-foreground";
const ALERT_DESTRUCTIVE_V1 =
  "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive";

const alertVariants = cva("", 
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/40 bg-destructive/5 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => {
  const v1 = useAspectoV1();
  return (
  <div
    ref={ref}
    role="alert"
    className={cn(v1 ? ALERT_V1 : ALERT_V2, (v1 && (variant === "destructive" ? ALERT_DESTRUCTIVE_V1 : null)) || alertVariants({ variant }), className)}
    {...props}
  />
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
