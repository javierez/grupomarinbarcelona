import Image from "next/image";
import { RichText } from "~/components/ui/rich-text";
import type { BloqueDe } from "~/lib/pagina-propia";
import { TituloDeBloque } from "./piezas";

/** Texto con **negrita** y párrafos, y una foto al lado si la lleva (a la derecha salvo que diga izquierda). */
export function Texto({ bloque }: { bloque: BloqueDe<"texto"> }) {
  const cuerpo = (
    <div className={bloque.imagen && bloque.imagenLado === "izquierda" ? "lg:order-2" : undefined}>
      {bloque.titulo && <TituloDeBloque>{bloque.titulo}</TituloDeBloque>}
      <RichText
        text={bloque.texto}
        className="text-base leading-relaxed text-muted-foreground sm:text-lg"
      />
    </div>
  );

  return (
    <section className="py-16 sm:py-20">
      {bloque.imagen ? (
        <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {cuerpo}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted" data-vesta="bloque.imagen">
            <Image
              src={bloque.imagen}
              alt={bloque.titulo ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
            />
          </div>
        </div>
      ) : (
        <div className="container max-w-3xl">{cuerpo}</div>
      )}
    </section>
  );
}
