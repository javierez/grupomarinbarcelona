import Image from "next/image";
import type { BloqueDe } from "~/lib/pagina-propia";
import { TituloDeBloque } from "./piezas";

/** Hasta 12 fotos de la agencia o de sus pisos, en rejilla, como el collage de /reformas. */
export function Galeria({ bloque }: { bloque: BloqueDe<"galeria"> }) {
  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        {bloque.titulo && <TituloDeBloque>{bloque.titulo}</TituloDeBloque>}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {bloque.imagenes.map((src, i) => (
            <div key={`${i}-${src}`} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted" data-vesta="bloque.imagen">
              <Image
                src={src}
                alt={bloque.titulo ? `${bloque.titulo} (${i + 1})` : ""}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 33vw"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
