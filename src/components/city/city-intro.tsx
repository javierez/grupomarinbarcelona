import { getFeaturesProps } from "~/server/queries/website-config";

interface CityIntroProps {
  city: string;
  intro: string;
}

export async function CityIntro({ city, intro }: CityIntroProps) {
  const paragraphs = intro
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return null;
  const minimal = (await getFeaturesProps()).headerStyle === "minimal";

  return (
    <section
      aria-labelledby={`city-intro-${city}`}
      className="mb-16 grid grid-cols-1 gap-8 border-y border-border/60 py-12 md:grid-cols-12"
    >
      <div className="md:col-span-4">
        {!minimal && (
          <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Inmobiliaria
          </span>
        )}
        <h2
          id={`city-intro-${city}`}
          className="mt-3 text-2xl font-medium tracking-tight text-foreground sm:text-3xl md:text-4xl"
        >
          {city}
        </h2>
      </div>
      <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:col-span-8">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}
