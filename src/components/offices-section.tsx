import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Info } from "lucide-react";
import { getOfficeCards } from "~/server/queries/offices";
import { isAccount141 } from "~/lib/account-overrides/141";
import type { OfficePhoto } from "~/lib/account-overrides/141-oficinas";

/**
 * "Elige tu oficina" — an image-led office picker on the homepage. Each card
 * links into the existing search page pre-filtered to the towns that office
 * covers.
 *
 * The town photos come from Wikimedia Commons under CC BY / CC BY-SA licences,
 * which require visible attribution — that's the ⓘ badge on each card. It sits
 * outside the <Link> on purpose, so its credit links aren't nested anchors.
 * Don't remove it.
 *
 * Currently only account 141 (Grupo Marín) has offices worth showing; renders
 * nothing for every other account, so it is safe to mount unconditionally.
 */
export async function OfficesSection({ accountId }: { accountId?: bigint } = {}) {
  if (!isAccount141(accountId)) return null;

  const offices = await getOfficeCards(accountId);
  if (offices.length === 0) return null;

  return (
    <section className="py-16 sm:py-20" id="oficinas">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
          Dónde estamos
        </span>
        <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          Elige tu oficina
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {offices.map((office) => (
          <div key={office.officeId} className="group/card relative">
            <Link
              href={office.href}
              className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                {office.photo ? (
                  <Image
                    src={office.photo.src}
                    alt={office.photo.alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover/card:scale-[1.05]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 bg-accent" />
                )}
                {/* Keeps the overlaid town name legible on any photo */}
                <div
                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl font-medium leading-tight tracking-tight text-white">
                    {office.city ?? office.name}
                  </h3>
                  {office.address && (
                    <p className="mt-1 text-xs leading-relaxed text-white/80">
                      {office.address}
                    </p>
                  )}
                </div>
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-eyebrow text-foreground">
                Ver viviendas
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover/card:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>

            {office.photo && <PhotoCredit photo={office.photo} />}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * CC attribution for a card's photo, as a hover/focus ⓘ badge in the corner.
 * Rendered as a sibling of the card link so the credit links stay valid.
 */
function PhotoCredit({ photo }: { photo: OfficePhoto }) {
  const label = `Foto: © ${photo.author} (${photo.license})`;

  return (
    <span className="group/credit absolute right-2 top-2 z-10">
      <span
        tabIndex={0}
        role="button"
        aria-label={label}
        title={label}
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-black/20 text-white/50 backdrop-blur-[2px] transition-colors hover:bg-black/50 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
      >
        <Info className="h-2.5 w-2.5" strokeWidth={2} aria-hidden />
      </span>

      <span className="pointer-events-none absolute right-0 top-6 z-20 w-56 rounded-lg bg-foreground p-3 text-[11px] leading-relaxed text-background opacity-0 shadow-[0_12px_28px_-10px_rgba(0,0,0,0.6)] transition-opacity duration-200 group-hover/credit:pointer-events-auto group-hover/credit:opacity-100 group-focus-within/credit:pointer-events-auto group-focus-within/credit:opacity-100">
        Foto © {photo.author} —{" "}
        <a
          href={photo.licenseUrl}
          target="_blank"
          rel="noopener noreferrer nofollow license"
          className="underline underline-offset-2"
        >
          {photo.license}
        </a>
        , vía{" "}
        <a
          href={photo.sourceUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline underline-offset-2"
        >
          Wikimedia Commons
        </a>
        . Recortada.
      </span>
    </span>
  );
}
