import {
  getTestimonialProps,
  getTestimonials,
} from "~/server/queries/testimonial";
import { TestimonialHeader } from "./TestimonialHeader";
import { TestimonialCarousel } from "./TestimonialCarousel";
import { Button } from "~/components/ui/button";
import { TestimonialsV3 } from "~/components/v3/testimonials-v3";

/**
 * Homepage "Opiniones" section.
 *
 * Opt-in on purpose: every account was seeded with three sample testimonials
 * ("Sara Jiménez", "Miguel Chen", "Emilia Rodríguez" — Acropolis copy), so
 * rendering whenever rows exist would drop placeholder text onto live sites.
 * It only appears once the agency ticks "Mostrar la sección en la web" in the
 * CRM (`testimonial_props.enabled`).
 */
export async function TestimonialsSection() {
  const [props, rows] = await Promise.all([
    getTestimonialProps(),
    getTestimonials(),
  ]);

  if (!props?.enabled) return null;
  if (rows.length === 0) return null;

  const testimonials = rows.map((t) => ({
    id: String(t.testimonialId),
    name: t.name ?? "",
    role: t.role ?? "",
    content: t.content ?? "",
    avatar: t.avatar ?? undefined,
    rating: t.rating ?? undefined,
  }));

  if (props.cardStyle === "v3") {
    return (
      <TestimonialsV3
        title={props.title || "Reseñas de clientes"}
        testimonials={testimonials}
        perPage={props.itemsPerPage}
        reviewsUrl={props.reviewsUrl}
      />
    );
  }

  return (
    // Light padding of its own: it sits between two sections that already
    // bring py-24..32, and doubling that left ~250px gaps around a short block.
    <section className="pb-4 pt-0 sm:pb-8" id="testimonials">
      <TestimonialHeader
        title={props.title || "Lo que dicen nuestros clientes"}
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
