import type { ReactNode } from "react";

/*
 * The footer columns in the v1 look (`features_props.aspectoV1`,
 * docs/v1-a-v2.md §3): bold, larger titles with a line under them and larger
 * links, in v1's own colours (its footer is always the light one,
 * `footerTint`). The v2 look is in `tinta`, the footer's ink, so it reads on
 * any footer colour.
 */

export function FooterHeading({ v1, children }: { v1: boolean; children: ReactNode }) {
  return v1 ? (
    <h3 className="relative mb-4 inline-block text-lg font-bold text-foreground sm:mb-6 sm:text-xl lg:mb-8">
      {children}
      <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-primary/60" />
    </h3>
  ) : (
    <h3 className="mb-6 text-xs font-medium uppercase tracking-eyebrow text-tinta/50">
      {children}
    </h3>
  );
}

export function footerLinkClass(v1: boolean): string {
  return v1
    ? "block py-1.5 text-base font-medium text-muted-foreground transition-all duration-300 hover:translate-x-2 hover:font-semibold hover:text-primary"
    : "block text-sm text-tinta/70 transition-colors hover:text-tinta";
}

export function footerListClass(v1: boolean): string {
  return v1 ? "space-y-2 sm:space-y-3 lg:space-y-4" : "space-y-3";
}
