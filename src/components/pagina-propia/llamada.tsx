import type { BloqueDe } from "~/lib/pagina-propia";
import { BotonDeBloque } from "./piezas";

/** El «¿Hablamos?» del final de /nosotros, con el texto y el botón del bloque. */
export function Llamada({ bloque }: { bloque: BloqueDe<"llamada"> }) {
  return (
    <section className="bg-muted/30 py-20 sm:py-24">
      <div className="container mx-auto">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-6 text-3xl font-medium tracking-tight text-foreground sm:text-4xl" data-vesta="bloque.titulo">
            {bloque.titulo}
          </h2>
          {bloque.texto && (
            <p className="mb-8 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {bloque.texto}
            </p>
          )}
          <BotonDeBloque boton={bloque.boton} />
        </div>
      </div>
    </section>
  );
}
