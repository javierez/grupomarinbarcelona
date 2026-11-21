import { Button } from "~/components/ui/button";
import { TestimonialsV3 } from "~/components/v3/testimonials-v3";
import type { TestimonialProps } from "~/lib/data";
import { TestimonialCarousel } from "./TestimonialCarousel";
import { TestimonialHeader } from "./TestimonialHeader";

export interface Opinion {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
}

/**
 * «Opiniones» de la portada, ya con sus datos. La pintan la web
 * (`TestimonialsSection`) y la vista previa del CRM: la vista previa tenía su
 * copia sin la v3 ni el botón de Google (17-nov-2026).
 *
 * Opt-in on purpose: every account was seeded with three sample testimonials
 * ("Sara Jiménez", "Miguel Chen", "Emilia Rodríguez" — Acropolis copy), so
 * rendering whenever rows exist would drop placeholder text onto live sites.
 * It only appears once the agency ticks "Mostrar la sección en la web" in the
 * CRM (`testimonial_props.enabled`).
 */
export function Opiniones({
  props,
  testimonials,
  titulo,
}: {
  props: TestimonialProps | null;
  testimonials: Opinion[];
  /** An own page's block title; unset → the one set in the CRM. */
  titulo?: string;
}) {
  if (!props?.enabled) return null;
  if (testimonials.length === 0) return null;

  if (props.cardStyle === "v3") {
    return (
      <TestimonialsV3
        title={titulo ?? (props.title || "Reseñas de clientes")}
        testimonials={testimonials}
        perPage={props.itemsPerPage}
        reviewsUrl={props.reviewsUrl}
      />
    );
  }

  return (
    // Light padding of its own: it sits between two sections that already
    // bring py-24..32, and doubling that left ~250px gaps around a short block.
    <section className="pb-4 pt-0 sm:pb-8" id="testimonials" data-vesta="opiniones">
      <TestimonialHeader
        title={titulo ?? (props.title || "Lo que dicen nuestros clientes")}
        subtitle={props.subtitle ?? ""}
      />
      <TestimonialCarousel
        testimonials={testimonials}
        cardStyle={props.cardStyle ?? "avatar"}
      />
      {props.reviewsUrl && (
        <div className="mt-12 flex justify-center">
          <Button size="pill" variant="outline" asChild>
            <a href={props.reviewsUrl} target="_blank" rel="noopener noreferrer">
              Ver todas las reseñas en Google
            </a>
          </Button>
        </div>
      )}
    </section>
  );
}
