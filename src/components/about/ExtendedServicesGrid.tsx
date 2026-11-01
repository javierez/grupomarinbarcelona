import Image from "next/image";
import { cn } from "~/lib/utils";
import { getServiceIcon } from "~/lib/service-icons";
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
}: ExtendedServicesGridProps) {
  const alignClass = descriptionAlignClass(descriptionAlign);
  return (
    <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-8 sm:gap-10">
      {services.map((service, i) => (
        <article
          key={i}
          className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.667rem)]"
        >
          {service.image ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          ) : null}

          <div className="flex flex-1 flex-col p-7 text-center">
            {/* Sin foto, el icono del servicio en el color de marca en vez de una caja gris vacía. */}
            {!service.image && service.icon ? (
              <ServiceIcon name={service.icon} />
            ) : null}
            <h3 className="mb-3 text-xl font-medium leading-tight tracking-tight text-foreground sm:text-2xl">
              {service.title}
            </h3>
            <p
              className={cn(
                "text-sm leading-relaxed text-muted-foreground sm:text-base",
                alignClass,
              )}
            >
              {service.description}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
