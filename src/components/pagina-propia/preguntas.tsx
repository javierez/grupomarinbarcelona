import { CityFaq } from "~/components/city/city-faq";
import FaqJsonLd from "~/components/city/faq-json-ld";
import type { BloqueDe } from "~/lib/pagina-propia";

/** Las preguntas de las páginas de ciudad, con su FAQPage para Google. */
export function Preguntas({ bloque, id }: { bloque: BloqueDe<"preguntas">; id: string }) {
  const faq = bloque.items.map((item) => ({ q: item.pregunta, a: item.respuesta }));
  return (
    <div className="container pb-16">
      <FaqJsonLd faq={faq} />
      <CityFaq
        city={id}
        title={bloque.titulo ?? "Lo que más nos preguntan"}
        faq={faq}
        vesta={{ titulo: "bloque.titulo", pregunta: "bloque.pregunta" }}
      />
    </div>
  );
}
