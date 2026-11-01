import Image from "next/image";
import Link from "next/link";
import { SocialLinks, type SocialLink } from "~/components/ui/social-links";

interface FooterV3Props {
  companyName: string;
  logoUrl: string | null;
  socialLinks: SocialLink[];
  offices: Array<{ name: string; address: string[]; phone: string; email: string }>;
  copyright: string;
}

const LEGAL = [
  { text: "Aviso Legal", href: "/aviso-legal" },
  { text: "Protección de datos", href: "/proteccion-de-datos" },
  { text: "Política de cookies", href: "/cookies" },
  { text: "Contacto", href: "/contacto" },
];

/**
 * `features_props.footerStyle: "v3"`: white footer with the logo and social
 * icons on the left and "Dirección" / "Contactos" columns on the right, over
 * a brand-colour strip with the legal links and the copyright.
 */
export function FooterV3({ companyName, logoUrl, socialLinks, offices, copyright }: FooterV3Props) {
  const phones = [...new Set(offices.map((o) => o.phone).filter(Boolean))];
  const emails = [...new Set(offices.map((o) => o.email).filter(Boolean))];

  return (
    <footer className="bg-background text-sm">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:px-8 sm:grid-cols-[1fr_auto_auto] sm:gap-16 lg:gap-28">
        <div>
          <Link href="/" aria-label={companyName} className="inline-block">
            {logoUrl ? (
              <Image src={logoUrl} alt={companyName} width={200} height={64} className="h-14 w-auto object-contain" />
            ) : (
              <span className="text-xl font-medium">{companyName}</span>
            )}
          </Link>
          {socialLinks.length > 0 && (
            <SocialLinks links={socialLinks} className="mt-4 gap-4 text-muted-foreground" />
          )}
        </div>

        {offices.length > 0 && (
          <div>
            <h4 className="mb-2.5 font-semibold text-foreground/70">Dirección</h4>
            {offices.map((o, i) => (
              <p key={i} className="font-light leading-relaxed text-muted-foreground [&+&]:mt-3">
                {o.address.slice(0, 2).map((line, j) => (
                  // "Madrid, Madrid" (city = province) reads as a typo.
                  <span key={j} className="block">{line.replace(/^(.+), \1$/, "$1")}</span>
                ))}
              </p>
            ))}
          </div>
        )}

        {(phones.length > 0 || emails.length > 0) && (
          <div>
            <h4 className="mb-2.5 font-semibold text-foreground/70">Contactos</h4>
            {emails.map((e) => (
              <a key={e} href={`mailto:${e}`} className="block font-light leading-relaxed text-muted-foreground hover:text-foreground">
                {e}
              </a>
            ))}
            {phones.map((p) => (
              <a key={p} href={`tel:${p.replace(/\s+/g, "")}`} className="block font-light leading-relaxed text-muted-foreground hover:text-foreground">
                {p}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="bg-brand py-7 text-center text-xs text-brand-foreground">
        <nav className="flex flex-wrap justify-center gap-x-2 gap-y-1 px-4">
          {LEGAL.map((l, i) => (
            <span key={l.href} className="flex gap-2">
              {i > 0 && <span aria-hidden="true">|</span>}
              <Link href={l.href} className="hover:underline">{l.text}</Link>
            </span>
          ))}
        </nav>
        <p className="mt-3 opacity-90">{copyright}</p>
      </div>
    </footer>
  );
}
