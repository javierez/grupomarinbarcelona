"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "~/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    /** The v1 search (`buscadorColorMarca`): thicker grey track, bar and handles in the brand colour. */
    marca?: boolean;
    /** The v1 of 111 and 137 drew no handles (they read `defaultValue` on a controlled slider). */
    sinAsas?: boolean;
  }
>(({ className, marca = false, sinAsas = false, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative w-full grow overflow-hidden rounded-full",
        marca ? "h-2 bg-secondary" : "h-1 bg-border",
      )}
    >
      <SliderPrimitive.Range
        className={cn("absolute h-full", marca ? "bg-brand" : "bg-foreground")}
      />
    </SliderPrimitive.Track>
    {/* One handle per value. The home search is controlled (`value`): reading
        only `defaultValue` left it with no handles at all. The v1 of 111 and
        137 (`sinAsas`) keep exactly that: a plain bar, as they look live today. */}
    {(sinAsas ? undefined : (props.value ?? props.defaultValue))?.map((_: number, index: number) => (
      <SliderPrimitive.Thumb
        key={index}
        className={cn(
          "block h-5 w-5 rounded-full border-2 bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          marca
            ? "border-brand transition-colors"
            : "border-foreground shadow-sm transition-all hover:scale-110",
        )}
      />
    ))}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
