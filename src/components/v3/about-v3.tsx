import Image from "next/image";
import Link from "next/link";
import type { AboutProps } from "~/lib/data";
import { ServicesIconList } from "~/components/about/ServicesIconList";
import { cn } from "~/lib/utils";

interface AboutV3Props {
  about: AboutProps | null;
  /** Where "Conocer más" goes: /nosotros when the page exists. */
  moreHref: string;
}

// Darker shade of the brand colour for headings, so a pale brand (Halfen's
// beige) still reads as text.
// The `color:` hint tells tailwind-merge this is a colour; without it cn()
// takes it for a font size and drops the real size next to it.
const BRAND_INK = "text-[color:color-mix(in_srgb,hsl(var(--brand))_55%,black)]";

/**
 * `features_props.aboutStyle: "v3"`: full-width split, photo on one half and
 * the copy on the other, then the services as the two-column icon list under
 * their own heading. Without `about_props.image` the copy stands alone,
 * centred.
 */
export function AboutV3({ about, moreHref }: AboutV3Props) {
  const eyebrow = about?.title || "Sobre Nosotros";
  const heading = about?.subtitle || "";
  const paragraphs = [about?.content, about?.content2].filter(
    (p): p is string => !!p?.trim(),
  );
  const services = about?.extendedServices?.length
    ? about.extendedServices
    : (about?.services ?? []);
  const image = about?.image;

  return (
    <>
      <section
        id="about"
        className={cn(
          "mx-[calc(50%-50vw)] mt-20 bg-white lg:mt-28",
          image && "grid lg:grid-cols-2",
        )}
      >
        {image && (
          <div className="relative min-h-[380px] lg:min-h-[560px]">
            <Image
              src={image}
              alt={eyebrow}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[center_20%]"
            />
          </div>
        )}
        <div
          className={cn(
            "flex flex-col justify-center px-6 py-20 sm:px-12 lg:px-[clamp(48px,7vw,110px)]",
            !image && "mx-auto max-w-3xl text-center",
          )}
        >
          <span className="text-xs font-normal uppercase tracking-[0.3em] text-brand">
            {eyebrow}
          </span>
          {heading && (
            <h2 className={cn("mt-4 text-[clamp(28px,3vw,34px)] font-normal leading-tight", BRAND_INK)}>
              {heading}
            </h2>
          )}
          <div className="mt-6 space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line text-base font-light leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </div>
          <Link
            href={moreHref}
            className={cn(
              "mt-8 inline-flex h-[46px] items-center border border-brand px-8 text-sm font-light transition-colors hover:bg-brand hover:text-brand-foreground",
              BRAND_INK,
              image ? "self-start" : "self-center",
            )}
          >
            Conocer más
          </Link>
        </div>
      </section>

      {services.length > 0 && (
        <section className="py-24 sm:py-28">
          <h2 className={cn("mb-14 text-center text-[clamp(24px,2.6vw,30px)] font-normal sm:mb-20", BRAND_INK)}>
            {about?.servicesSectionTitle || "Nuestros Servicios"}
          </h2>
          <ServicesIconList
            services={services.slice(0, about?.maxServicesDisplayed || 6)}
          />
        </section>
      )}
    </>
  );
}
