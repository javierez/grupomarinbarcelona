import Image from "next/image";
import {
  Shield,
  ShieldCheck,
  Handshake,
  Heart,
  Sparkles,
  Award,
  Users,
  Target,
  Zap,
  Eye,
  Compass,
  Layers,
  HelpCircle,
  User,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { descriptionAlignClass } from "~/lib/description-align";
import type { AboutProps } from "~/lib/data";
import type { FeaturesProps } from "~/server/queries/website-config";

const iconComponents = {
  shield: Shield,
  shieldcheck: ShieldCheck,
  handshake: Handshake,
  heart: Heart,
  sparkles: Sparkles,
  award: Award,
  users: Users,
  target: Target,
  zap: Zap,
  eye: Eye,
  compass: Compass,
  layers: Layers,
} as const;

function getIcon(name?: string) {
  if (!name) return HelpCircle;
  const key = name.trim().toLowerCase() as keyof typeof iconComponents;
  return iconComponents[key] ?? HelpCircle;
}

interface Props {
  aboutProps: AboutProps;
  features: FeaturesProps;
}

/**
 * "split" /nosotros layout (features_props.nosotrosLayout === "split"):
 *  - "De dónde venimos" left-aligned in a left column, "Valores fundamentales"
 *    cards stacked in the right column (side-by-side on desktop).
 *  - A compact team section underneath with a small avatar per member.
 * Entirely DB-driven (about_props), so any account can opt in via the admin.
 */
export function NosotrosSplitLayout({ aboutProps, features }: Props) {
  const alignClass = descriptionAlignClass(features.descriptionAlign);
  const values = aboutProps.values ?? [];
  const team = aboutProps.team ?? [];

  return (
    <>
      {/* Origins (left) + Values (right) */}
      <section className="py-20 sm:py-24" id="origenes">
        <div className="container mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: De dónde venimos */}
            <div className="text-left">
              <h2 className="mb-6 text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
                {aboutProps.originsTitle ?? "De dónde venimos"}
              </h2>
              {aboutProps.originsContent && (
                <p
                  className={cn(
                    "text-base leading-relaxed text-muted-foreground sm:text-lg",
                    alignClass,
                  )}
                >
                  {aboutProps.originsContent}
                </p>
              )}
              {aboutProps.originsContent2 && (
                <p
                  className={cn(
                    "mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg",
                    alignClass,
                  )}
                >
                  {aboutProps.originsContent2}
                </p>
              )}
            </div>

            {/* Right: Valores fundamentales */}
            {values.length > 0 && (
              <div id="valores">
                <h3 className="mb-6 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                  Valores fundamentales
                </h3>
                <div className="space-y-3">
                  {values.map((value, i) => {
                    const Icon = getIcon(value.icon);
                    return (
                      <div
                        key={i}
                        className="flex gap-3 rounded-xl border border-border/60 bg-background p-4 transition-colors hover:border-foreground/30"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60">
                          <Icon className="h-4 w-4 text-foreground/70" />
                        </div>
                        <div>
                          <h4 className="mb-0.5 text-sm font-medium text-foreground">
                            {value.title}
                          </h4>
                          <p className={cn("text-xs leading-relaxed text-muted-foreground", alignClass)}>
                            {value.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Team */}
      {team.length > 0 && (
        <section className="bg-muted/30 py-20 sm:py-24" id="equipo">
          <div className="container mx-auto">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Nuestro equipo
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                Nuestro equipo de expertos está en constante búsqueda para
                ofrecerte las mejores oportunidades de compra/venta.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3">
              {team.map((member, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="relative mb-4 h-36 w-36 overflow-hidden rounded-full border border-border/60 bg-muted">
                    {member.photo ? (
                      <Image
                        src={member.photo}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="144px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-14 w-14 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-medium text-foreground">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {member.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
