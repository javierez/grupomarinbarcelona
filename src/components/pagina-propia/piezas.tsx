import Link from "next/link";
import { Button } from "~/components/ui/button";
import { esEnlaceInterno } from "~/lib/nav-extra";

/** El botón de un bloque: el mismo `Button` en píldora que el resto de la web. */
export function BotonDeBloque({ boton }: { boton: { texto: string; href: string } }) {
  return (
    <Button size="pill" asChild data-vesta="bloque.boton">
      {esEnlaceInterno(boton.href) ? (
        <Link href={boton.href}>{boton.texto}</Link>
      ) : (
        <a href={boton.href} rel="noopener noreferrer">
          {boton.texto}
        </a>
      )}
    </Button>
  );
}

/** El título de un bloque, como los de las secciones de /reformas o /nosotros. */
export function TituloDeBloque({ children, centrado = false }: { children: string; centrado?: boolean }) {
  return (
    <h2
      data-vesta="bloque.titulo"
      className={`mb-10 text-3xl font-medium tracking-tight text-foreground sm:text-4xl${centrado ? " text-center" : ""}`}
    >
      {children}
    </h2>
  );
}

/** Solo en el borrador: por qué un bloque no se ve en la web publicada. */
export function AvisoDeBorrador({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
