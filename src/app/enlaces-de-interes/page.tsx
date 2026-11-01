import type { Metadata } from "next";
import Footer from "~/components/footer";
import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import { getLinksProps } from "~/server/queries/website-config";
import { faviconUrl } from "~/lib/link-favicon";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Enlaces de Interés",
  description:
    "Directorio de enlaces útiles: organismos oficiales, bancos, prensa, medios de comunicación y más recursos de interés.",
  alternates: {
    canonical: `${baseUrl}/enlaces-de-interes`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function EnlacesDeInteresPage() {
  const categories = await getLinksProps();

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center text-xs font-medium uppercase tracking-eyebrow">
            <li>
              <Link
                href="/"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Inicio
              </Link>
            </li>
            <li className="mx-3 text-muted-foreground/50">/</li>
            <li className="text-foreground" aria-current="page">
              Enlaces de Interés
            </li>
          </ol>
        </nav>
      </div>

      {/* Main content */}
      <section className="pb-16 pt-12 sm:pb-20 lg:pb-28">
        <div className="container">
          {/* Header */}
          <div className="mb-20 text-center">
            <span className="mb-5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              Recursos
            </span>
            <h1 className="mb-6 text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Enlaces de Interés
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Directorio de enlaces útiles a organismos oficiales, medios de
              comunicación, entidades bancarias y otros recursos de interés.
            </p>
          </div>

          {/* Link Categories */}
          <div className="mx-auto max-w-4xl space-y-16">
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No hay enlaces disponibles en este momento.
              </p>
            ) : (
              categories.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                    Categoría
                  </span>
                  <h2 className="mb-8 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                    {category.name}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.links.map((link, linkIndex) => {
                      const icon = faviconUrl(link.url);
                      return (
                        <a
                          key={linkIndex}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-xl border border-border/60 bg-transparent px-5 py-4 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-accent"
                        >
                          {/* The organism's own mark, so the directory is
                              scannable by sight rather than by reading. */}
                          {icon ? (
                            <img
                              src={icon}
                              alt=""
                              width={16}
                              height={16}
                              loading="lazy"
                              className="h-4 w-4 flex-shrink-0 object-contain"
                            />
                          ) : (
                            <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
                          )}
                          <span className="flex-1 truncate text-foreground">
                            {link.title}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
