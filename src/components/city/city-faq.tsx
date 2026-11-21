import { ChevronDown } from "lucide-react";
import type { Clave } from "~/lib/seleccion-claves";

interface CityFaqProps {
  city: string;
  faq: Array<{ q: string; a: string }>;
  /** Heading. Unset → «Sobre <city>». An own page passes its block's title. */
  title?: string;
  /** Only an own page: what «Mi web» calls the heading and each question (§6.1). */
  vesta?: { titulo: Clave; pregunta: Clave };
}

export function CityFaq({ city, faq, title = `Sobre ${city}`, vesta }: CityFaqProps) {
  if (faq.length === 0) return null;

  return (
    <section
      aria-labelledby={`city-faq-${city}`}
      className="mx-auto mt-16 max-w-3xl"
    >
      <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Preguntas frecuentes
      </span>
      <h2
        id={`city-faq-${city}`}
        className="mb-8 text-2xl font-medium tracking-tight text-foreground sm:text-3xl"
        data-vesta={vesta?.titulo}
      >
        {title}
      </h2>
      <div className="border-t border-border/60">
        {faq.map((item, i) => (
          <details
            key={i}
            className="group border-b border-border/60"
            data-vesta={vesta?.pregunta}
            data-vesta-nombre={vesta ? item.q : undefined}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-base font-medium text-foreground marker:hidden">
              {item.q}
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 group-open:rotate-180 group-open:border-foreground group-open:text-foreground">
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </span>
            </summary>
            <p className="whitespace-pre-line pb-6 pr-12 text-base leading-relaxed text-muted-foreground">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
