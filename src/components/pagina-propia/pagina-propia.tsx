import Footer from "~/components/footer";
import type { Bloque, PaginaWeb } from "~/lib/pagina-propia";
import { getFeaturesProps, type FeaturesProps } from "~/server/queries/website-config";
import { Cabecera } from "./cabecera";
import { Formulario } from "./formulario";
import { Galeria } from "./galeria";
import { Inmuebles } from "./inmuebles";
import { Llamada } from "./llamada";
import { Preguntas } from "./preguntas";
import { Testimonios } from "./testimonios";
import { Texto } from "./texto";

/**
 * Una página de la agencia (`features_props.paginas`, contrato web-por-chat
 * §10): sus bloques, uno debajo de otro, con las piezas de la web. Sin una
 * cabecera arriba, el título va como en /vender, para que la página tenga su h1.
 */
export async function PaginaPropia({ pagina, borrador }: { pagina: PaginaWeb; borrador: boolean }) {
  const features = await getFeaturesProps();
  return (
    <>
      {pagina.bloques[0]?.tipo !== "cabecera" && (
        <header className="container pt-16 text-center sm:pt-20 lg:pt-24">
          <h1
            className="mx-auto max-w-4xl text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
            data-vesta="pagina.titulo"
            data-vesta-pagina={pagina.slug}
          >
            {pagina.titulo}
          </h1>
        </header>
      )}
      {pagina.bloques.map((bloque, i) => (
        // Sin caja propia: solo dice a «Mi web» qué bloque de qué página es (§6.1).
        <div
          key={i}
          className="contents"
          data-vesta="bloque"
          data-vesta-i={i}
          data-vesta-bloque={bloque.tipo}
          data-vesta-pagina={pagina.slug}
        >
          <BloqueDePagina
            bloque={bloque}
            id={`${pagina.slug}-${i + 1}`}
            features={features}
            borrador={borrador}
          />
        </div>
      ))}
      <Footer />
    </>
  );
}

function BloqueDePagina({
  bloque,
  id,
  features,
  borrador,
}: {
  bloque: Bloque;
  id: string;
  features: FeaturesProps;
  borrador: boolean;
}) {
  switch (bloque.tipo) {
    case "cabecera":
      return <Cabecera bloque={bloque} size={features.pageHeroSize} />;
    case "texto":
      return <Texto bloque={bloque} />;
    case "inmuebles":
      return <Inmuebles bloque={bloque} borrador={borrador} />;
    case "galeria":
      return <Galeria bloque={bloque} />;
    case "formulario":
      return <Formulario bloque={bloque} venderFormulario={features.venderFormulario} />;
    case "preguntas":
      return <Preguntas bloque={bloque} id={id} />;
    case "llamada":
      return <Llamada bloque={bloque} />;
    case "testimonios":
      return <Testimonios bloque={bloque} borrador={borrador} />;
  }
}
