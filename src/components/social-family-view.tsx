// Pure, sync and free of any `~/server/*` import, so a client component can
// render it. Keeping it inside social-family-section.tsx pulled that module
// (and its Drizzle query) into the client bundle.
import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import type { SocialLink } from "~/components/ui/social-links";

export interface SocialFamilySectionProps {
  links: SocialLink[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  /**
   * Restrict the cards to these platforms (in addition to whatever the account
   * has configured). Unset → show every configured network. Lets an account run
   * four icons in the navbar/footer but feature only a subset as cards.
   */
  platforms?: SocialLink["platform"][];
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.12Z" />
    </svg>
  );
}

const PLATFORM_META = {
  instagram: {
    label: "Instagram",
    cta: "Síguenos",
    Icon: Instagram,
    accent:
      "bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white",
  },
  tiktok: {
    label: "TikTok",
    cta: "Mira nuestros vídeos",
    Icon: TikTokIcon,
    accent: "bg-black text-white",
  },
  linkedin: {
    label: "LinkedIn",
    cta: "Conecta con nosotros",
    Icon: Linkedin,
    accent: "bg-[#0a66c2] text-white",
  },
  youtube: {
    label: "YouTube",
    cta: "Suscríbete",
    Icon: Youtube,
    accent: "bg-[#ff0000] text-white",
  },
  facebook: {
    label: "Facebook",
    cta: "Dale me gusta",
    Icon: Facebook,
    accent: "bg-[#1877f2] text-white",
  },
  twitter: {
    label: "Twitter / X",
    cta: "Síguenos",
    Icon: Facebook,
    accent: "bg-foreground text-background",
  },
} as const;

/**
 * Derive an @handle from a profile URL. Returns null when the URL carries no
 * human-readable handle — Facebook's `/profile.php?id=<numeric id>` form (and
 * bare numeric-id pages) would otherwise render as "@profile.php".
 */
function handleFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean);
    if (!seg.length) return null;
    const last = seg[seg.length - 1] ?? "";
    if (last.endsWith(".php") || /^\d+$/.test(last)) return null;
    return last.startsWith("@") ? last : `@${last.replace(/^@/, "")}`;
  } catch {
    return null;
  }
}

export function SocialFamilyView({
  links,
  title = "Sé uno más de la familia",
  subtitle = "Síguenos para no perderte nuestras nuevas propiedades, contenido exclusivo y un poco de lo que somos.",
  eyebrow = "Redes sociales",
  platforms,
  minimal = false,
}: SocialFamilySectionProps & { minimal?: boolean }) {
  if (!links?.length) return null;

  // Preferred order — most engagement first.
  const order: SocialLink["platform"][] = [
    "instagram",
    "tiktok",
    "youtube",
    "linkedin",
    "facebook",
    "twitter",
  ];
  const visible = platforms?.length
    ? links.filter((l) => platforms.includes(l.platform))
    : links;
  if (!visible.length) return null;
  const ordered = [...visible].sort(
    (a, b) => order.indexOf(a.platform) - order.indexOf(b.platform),
  );

  return (
    <section className="relative z-10 bg-background py-20 sm:py-24" id="redes">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {!minimal && (
            <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              {eyebrow}
            </span>
          )}
          <h2 className="mb-5 text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
            {title}
          </h2>
          {!minimal && subtitle.trim() !== "" && (
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-5">
          {ordered.map((link) => {
            const meta = PLATFORM_META[link.platform];
            if (!meta) return null;
            const Icon = meta.Icon;
            const handle = handleFromUrl(link.url);
            return (
              <Link
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-[300px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-background transition-shadow hover:shadow-lg sm:w-[340px]"
                aria-label={handle ? `${meta.label} — ${handle}` : meta.label}
              >
                <div
                  className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden ${meta.accent}`}
                >
                  {link.previewImage ? (
                    <>
                      <Image
                        src={link.previewImage}
                        alt={`${meta.label} preview`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="340px"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
                      <Icon className="relative z-10 h-10 w-10 drop-shadow-md transition-transform duration-300 group-hover:scale-110" />
                    </>
                  ) : (
                    <Icon className="h-12 w-12 transition-transform duration-300 group-hover:scale-110" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-5">
                  <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    {meta.label}
                  </span>
                  {handle && (
                    <span className="truncate text-base font-medium text-foreground">
                      {handle}
                    </span>
                  )}
                  <span className="mt-auto pt-3 text-xs font-medium uppercase tracking-eyebrow text-foreground/70 transition-colors group-hover:text-foreground">
                    {meta.cta} <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
