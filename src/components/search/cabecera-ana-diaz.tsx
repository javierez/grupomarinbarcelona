import { ACCOUNT_137_SEARCH_GREEN } from "~/lib/account-overrides/137";

/** Ana Díaz (137): su logo y su nombre encima del buscador de la portada, como en la v1. */
export function CabeceraAnaDiaz({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Inmobiliaria Ana Díaz"
          className="h-12 w-auto shrink-0 -translate-y-1.5 sm:h-14 sm:-translate-y-2 md:h-16"
        />
      )}
      <h2
        className="text-left text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
        style={{ color: ACCOUNT_137_SEARCH_GREEN, fontFamily: "var(--font-playfair)" }}
      >
        Inmobiliaria Ana Díaz
      </h2>
    </div>
  );
}
