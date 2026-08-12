import type { Metadata } from "next";
import Link from "next/link";
import Footer from "~/components/footer";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe o ha sido eliminada.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="mb-6 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
          Error 404
        </span>
        <h1 className="font-display mb-4 text-7xl font-light italic leading-none text-foreground sm:text-8xl md:text-9xl">
          404
        </h1>
        <h2 className="mb-5 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
          Página no encontrada
        </h2>
        <p className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground">
          Lo sentimos, la página que buscas no existe o ha sido eliminada.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-base font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Volver al inicio
          </Link>
          <Link
            href="/contacto"
            className="inline-flex h-12 items-center justify-center rounded-full border border-foreground/30 bg-transparent px-8 text-base font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Contactar
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
