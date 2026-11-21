import { PageHeroBanner } from "~/components/page-hero-banner";
import type { BloqueDe } from "~/lib/pagina-propia";
import { BotonDeBloque } from "./piezas";

/** La cabecera de /servicios y /nosotros, con la altura que la agencia eligió para ellas. */
export function Cabecera({
  bloque,
  size,
}: {
  bloque: BloqueDe<"cabecera">;
  size?: "short" | "standard" | "full";
}) {
  return (
    <PageHeroBanner
      title={bloque.titulo}
      subtitle={bloque.subtitulo}
      backgroundType="image"
      backgroundImage={bloque.imagen}
      size={size}
      vesta={{ titulo: "bloque.titulo", subtitulo: "bloque.subtitulo", fondo: "bloque.imagen" }}
    >
      {bloque.boton && <BotonDeBloque boton={bloque.boton} />}
    </PageHeroBanner>
  );
}
