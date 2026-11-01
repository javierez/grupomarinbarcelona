import Link from "next/link";
import { House } from "lucide-react";
import type { FeaturesProps } from "~/server/queries/website-config";

/**
 * `features_props.ctaBand`: full-width photo band with a framed house icon
 * hanging from a thin line, a title, one line of copy and an outlined button.
 * Fixed background on desktop (parallax feel); iOS ignores `fixed`, so small
 * screens scroll it normally. Renders nothing without an image.
 */
export function CtaBand({ band }: { band: FeaturesProps["ctaBand"] }) {
  if (!band?.image) return null;

  return (
    <section
      // Full bleed out of the homepage's max-w-7xl column.
      className="relative mx-[calc(50%-50vw)] flex min-h-[520px] items-center justify-center bg-cover bg-center bg-no-repeat px-6 py-24 text-center text-white md:bg-fixed lg:min-h-[590px]"
      style={{ backgroundImage: `url("${band.image}")` }}
    >
      <div className="absolute inset-0 bg-[rgb(50,40,25)]/50" />
      <div className="relative max-w-xl">
        <div className="relative mx-auto mb-14 flex h-[76px] w-[76px] items-center justify-center border border-white before:absolute before:bottom-full before:left-1/2 before:h-24 before:w-px before:bg-white">
          <House className="h-10 w-10" strokeWidth={1.2} />
        </div>
        <h2 className="text-[clamp(28px,3vw,36px)] font-normal">
          {band.title || "¿Busca un inmueble?"}
        </h2>
        {band.subtitle && (
          <p className="mx-auto mt-10 max-w-lg text-[clamp(18px,1.8vw,22px)] font-normal leading-tight">
            {band.subtitle}
          </p>
        )}
        <Link
          href={band.href || "/#contact"}
          className="mt-12 inline-flex h-[50px] w-40 items-center justify-center border border-white text-sm font-light transition-colors hover:bg-white hover:text-foreground"
        >
          {band.buttonText || "Ver más"}
        </Link>
      </div>
    </section>
  );
}
