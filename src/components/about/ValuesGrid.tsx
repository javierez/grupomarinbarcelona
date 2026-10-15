import { getFeaturesProps } from "~/server/queries/website-config";
import { getServiceIcon } from "~/lib/service-icons";
import { cn } from "~/lib/utils";
import { descriptionAlignClass } from "~/lib/description-align";

interface ValuesGridProps {
  title?: string;
  values: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
}

export async function ValuesGrid({ title = "Valores Fundamentales", values }: ValuesGridProps) {
  if (!values?.length) return null;
  const features = await getFeaturesProps();
  const minimal = features.headerStyle === "minimal";
  const alignClass = descriptionAlignClass(features.descriptionAlign);

  return (
    <section className="bg-muted/30 py-20 sm:py-24" id="valores">
      <div className="container mx-auto">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {!minimal && (
            <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              Lo que nos define
            </span>
          )}
          <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
        </div>

        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6">
          {values.map((value, i) => {
            const Icon = getServiceIcon(value.icon);
            // Center the row regardless of count: ≤3 values → 3-up on lg,
            // 4 values → 4-up. Either way the grid is centered, not left-aligned.
            const lgBasis =
              values.length >= 4
                ? "lg:w-[calc(25%-1.125rem)]"
                : "lg:w-[calc(33.333%-1rem)]";
            return (
              <div
                key={i}
                className={`w-full rounded-2xl border border-border/60 bg-background p-8 transition-colors hover:border-foreground/30 sm:w-[calc(50%-0.75rem)] ${lgBasis}`}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-border/60">
                  <Icon className="h-5 w-5 text-foreground/70" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  {value.title}
                </h3>
                <p className={cn("text-sm leading-relaxed text-muted-foreground", alignClass)}>
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
