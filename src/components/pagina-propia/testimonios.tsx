import { TestimonialsSection } from "~/components/testimonials/TestimonialsSection";
import type { BloqueDe } from "~/lib/pagina-propia";
import { getTestimonialProps, getTestimonials } from "~/server/queries/testimonial";
import { AvisoDeBorrador } from "./piezas";

/**
 * Las opiniones de la home. Salen solo si la agencia marcó «Mostrar la
 * sección en la web» (las de ejemplo de cada cuenta no deben verse); si no,
 * nada, y en el borrador un aviso.
 */
export async function Testimonios({ bloque, borrador }: { bloque: BloqueDe<"testimonios">; borrador: boolean }) {
  const [props, filas] = await Promise.all([getTestimonialProps(), getTestimonials()]);
  if (!props?.enabled || filas.length === 0) {
    if (!borrador) return null;
    return (
      <section className="py-16 sm:py-20">
        <div className="container">
          <AvisoDeBorrador>
            Las opiniones salen cuando se marca «Mostrar la sección en la web» en las opiniones del CRM. Hasta entonces, este bloque no se ve.
          </AvisoDeBorrador>
        </div>
      </section>
    );
  }
  return (
    <div className="py-16 sm:py-20">
      <TestimonialsSection titulo={bloque.titulo} />
    </div>
  );
}
