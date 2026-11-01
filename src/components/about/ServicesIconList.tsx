import { getServiceIcon } from "~/lib/service-icons";

interface ServicesIconListProps {
  services: Array<{
    title: string;
    description?: string;
    icon?: string;
  }>;
}

/**
 * `features_props.servicesStyle: "icons"`: two even columns, each service a
 * brand-colour circle with its icon, the title beside it and the description
 * below. No cards, so long titles or uneven copy never leave boxes of
 * different heights. Shared by the homepage "Sobre Nosotros" and /servicios.
 *
 * A plain component (no hooks) so the CRM preview's client components can
 * render it too.
 */
export function ServicesIconList({ services }: ServicesIconListProps) {
  return (
    <div className="mx-auto grid max-w-5xl gap-x-16 gap-y-10 sm:grid-cols-2 sm:gap-y-12">
      {services.map((service, i) => {
        const Icon = getServiceIcon(service.icon);
        return (
          <div key={i} className="flex gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
              <Icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <div className="pt-1">
              <h3 className="text-lg font-medium leading-snug tracking-tight text-foreground sm:text-xl">
                {service.title}
              </h3>
              {service.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {service.description}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
