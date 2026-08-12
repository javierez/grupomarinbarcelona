import { BadgeEuro, CreditCard, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { getFeaturesProps } from "~/server/queries/website-config";
import {
  isAccount141,
  ACCOUNT_141_DIFFERENTIATORS,
} from "~/lib/account-overrides/141";

const iconComponents = {
  "badge-euro": BadgeEuro,
  "credit-card": CreditCard,
  "shield-check": ShieldCheck,
  zap: Zap,
} as const;

function getIcon(name: string) {
  return iconComponents[name as keyof typeof iconComponents] ?? HelpCircle;
}

/**
 * "Lo que nos diferencia" — a per-account differentiators section.
 * Currently only account 141 (Grupo Marín) has content; renders nothing
 * for every other account, so it is safe to mount unconditionally.
 */
export async function DifferentiatorsSection() {
  if (!isAccount141()) return null;

  const { eyebrow, title, subtitle, items } = ACCOUNT_141_DIFFERENTIATORS;
  const minimal = (await getFeaturesProps()).headerStyle === "minimal";

  return (
    <section className="py-20 sm:py-24" id="diferencia">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        {!minimal && (
          <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = getIcon(item.icon);
          return (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-background">
                <Icon className="h-7 w-7 text-brand" strokeWidth={1.5} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {item.lead}
                </span>{" "}
                {item.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
