import Image from "next/image";
import { cn } from "~/lib/utils";
import { getServiceIcon } from "~/lib/service-icons";
import { RichText } from "~/components/ui/rich-text";
import {
  descriptionAlignClass,
  type DescriptionAlign,
} from "~/lib/description-align";

interface ExtendedServicesGridProps {
  services: Array<{
    title: string;
    description: string;
    icon?: string;
    image?: string;
    bullets?: string[];
    ctaLabel?: string;
    ctaHref?: string;
  }>;
  /**
   * From `features_props.descriptionAlign`. Passed in rather than fetched here
   * so this stays a plain component: the CRM preview renders it from a client
   * component that repaints as the agency edits, and an async server component
   * cannot be used there at all.
   */
  descriptionAlign?: DescriptionAlign;
  /**
   * `features_props.serviciosLayout === "stacked"`: one full-width card per
   * row with the photo beside the copy, for long descriptions (Ecogar, 122,
   * from v1). Off → the 3-up grid every site has.
   */
  stacked?: boolean;
  /**
   * `features_props.aspectoV1`: the v1 card, with its grey photo box even
   * without a photo and no icon. "justificada": its copy justified (111, 122,
   * 137); "plana": as typed (21 and 142, `v1Primera`).
   */
  v1?: "justificada" | "plana";
}

function ServiceIcon({ name }: { name: string }) {
  const Icon = getServiceIcon(name);
  return (
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/15">
      <Icon className="h-7 w-7 text-brand" strokeWidth={1.75} />
    </div>
  );
}

export function ExtendedServicesGrid({
  services,
  descriptionAlign,
  stacked = false,
  v1,
}: ExtendedServicesGridProps) {
  const alignClass = descriptionAlignClass(descriptionAlign);
  return (
    <div
      data-vesta="servicios.ampliados"
      className={cn(
        "mx-auto flex",
        stacked
          ? "max-w-4xl flex-col gap-10 sm:gap-12"
          : "max-w-6xl flex-wrap justify-center gap-8 sm:gap-10",
      )}
    >
      {services.map((service, i) => (
        <article
          key={i}
          data-vesta="servicio.ampliado"
          data-vesta-i={i}
          data-vesta-nombre={service.title}
          className={cn(
            "group flex h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
            stacked
              ? "flex-col sm:flex-row"
              : "flex-col sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.667rem)]",
          )}
        >
          {service.image || v1 ? (
            <div
              className={cn(
                "relative w-full overflow-hidden bg-muted",
                stacked
                  ? "aspect-[4/3] shrink-0 sm:aspect-auto sm:w-2/5"
                  : "aspect-[4/3]",
              )}
            >
              {service.image ? (
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes={
                  stacked
                    ? "(max-width: 640px) 100vw, 40vw"
                    : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                }
              />
              ) : null}
            </div>
          ) : null}

          <div
            className={cn(
              "flex flex-1 flex-col p-7",
              stacked ? "text-left sm:p-9" : "text-center",
            )}
          >
            {/* Sin foto, el icono del servicio en el color de marca en vez de una caja gris vacía. */}
            {!service.image && !v1 && service.icon ? (
              <ServiceIcon name={service.icon} />
            ) : null}
            <h3 className="mb-3 text-xl font-medium leading-tight tracking-tight text-foreground sm:text-2xl">
              {service.title}
            </h3>
            {/* Light Markdown from the CRM (**negrita**, listas, enlaces), so
                Ecogar's `**` and `###` don't reach the page as literal text.
                Plain text renders as one paragraph, as before. Long-form
                stacked copy is justified unless descriptionAlign says
                otherwise, as in v1. */}
            <RichText
              text={service.description}
              className={cn(
                "text-sm leading-relaxed text-muted-foreground sm:text-base",
                alignClass !== "" ? alignClass : stacked || v1 === "justificada" ? "text-justify" : "",
              )}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
