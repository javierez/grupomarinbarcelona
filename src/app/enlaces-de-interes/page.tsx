import type { Metadata } from "next";
import Footer from "~/components/footer";
import Link from "next/link";
import { ExternalLink, Globe } from "lucide-react";
import { notFound } from "next/navigation";
import { getFeaturesProps, getLinksProps } from "~/server/queries/website-config";
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
  const [categories, features] = await Promise.all([getLinksProps(), getFeaturesProps()]);
  // La v1 de El Mito (`v1Inicial`) no tenía esta página: 404, como hoy.
  if (features.v1Inicial === true) notFound();
  // `aspectoV1`: las clases de las v1, tal cual. La primera v1 (`v1Primera`)
  // no ponía el icono de cada enlace.
  const v1 = features.aspectoV1 === true;
  const sinIcono = v1 && features.v1Primera === true;

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className={v1 ? "container mx-auto px-4 pt-8" : "container mx-auto px-4 pt-12"}>
        <nav className={v1 ? "py-4" : undefined} aria-label="Breadcrumb">
          <ol className={v1 ? "flex items-center text-sm" : "flex items-center text-xs font-medium uppercase tracking-eyebrow"}>
            <li>
              <Link
                href="/"
                className={v1 ? "text-muted-foreground transition-colors hover:text-primary" : "text-muted-foreground transition-colors hover:text-foreground"}
              >
                Inicio
              </Link>
            </li>
            <li className={v1 ? "mx-2" : "mx-3 text-muted-foreground/50"}>/</li>
            <li className={v1 ? "font-medium" : "text-foreground"} aria-current="page">
              Enlaces de Interés
            </li>
          </ol>
        </nav>
      </div>

      {/* Main content */}
      <section className={v1 ? "pb-12 pt-8 sm:pb-16 lg:pb-24" : "pb-16 pt-12 sm:pb-20 lg:pb-28"}>
        <div className="container">
          {/* Header */}
          <div className={v1 ? "mb-12 text-center" : "mb-20 text-center"}>
            {!v1 && (
              <span className="mb-5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                Recursos
              </span>
            )}
            <h1 className={v1 ? "mb-4 text-4xl font-bold tracking-tight" : "mb-6 text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"}>
              Enlaces de Interés
            </h1>
            <p className={v1 ? "mx-auto max-w-2xl text-lg text-muted-foreground" : "mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"}>
              Directorio de enlaces útiles a organismos oficiales, medios de
              comunicación, entidades bancarias y otros recursos de interés.
            </p>
          </div>

          {/* Link Categories */}
          <div className={v1 ? "mx-auto max-w-4xl space-y-10" : "mx-auto max-w-4xl space-y-16"}>
            {categories.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No hay enlaces disponibles en este momento.
              </p>
            ) : (
              categories.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  {!v1 && (
                    <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                      Categoría
                    </span>
                  )}
                  <h2 className={v1 ? "mb-6 text-2xl font-bold tracking-tight" : "mb-8 text-2xl font-medium tracking-tight text-foreground sm:text-3xl"}>
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
                          className={
                            v1
                              ? `group flex items-center ${sinIcono ? "gap-2" : "gap-2.5"} rounded-lg border border-border/40 px-4 py-3 text-sm font-medium transition-all hover:border-primary/40 hover:bg-accent hover:shadow-sm`
                              : "group flex items-center gap-3 rounded-xl border border-border/60 bg-transparent px-5 py-4 text-sm font-medium transition-colors hover:border-foreground/40 hover:bg-accent"
                          }
                        >
                          {/* The organism's own mark, so the directory is
                              scannable by sight rather than by reading. */}
                          {sinIcono ? null : icon ? (
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
                          <span className={v1 ? "flex-1 truncate" : "flex-1 truncate text-foreground"}>
                            {link.title}
                          </span>
                          <ExternalLink className={v1 ? "h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" : "h-3.5 w-3.5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"} />
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
