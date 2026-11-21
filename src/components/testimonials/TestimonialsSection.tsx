import {
  getTestimonialProps,
  getTestimonials,
} from "~/server/queries/testimonial";
import { Opiniones, type Opinion } from "./opiniones";

/** Las filas de la base tal como las pinta `Opiniones`. */
export function aOpiniones(
  rows: Awaited<ReturnType<typeof getTestimonials>>,
): Opinion[] {
  return rows.map((t) => ({
    id: String(t.testimonialId),
    name: t.name ?? "",
    role: t.role ?? "",
    content: t.content ?? "",
    avatar: t.avatar ?? undefined,
    rating: t.rating ?? undefined,
  }));
}

/** Homepage "Opiniones" section: fetches, then renders `Opiniones`. */
export async function TestimonialsSection({
  accountId,
  titulo,
}: {
  accountId?: bigint;
  /** An own page's block title; unset → the one set in the CRM. */
  titulo?: string;
} = {}) {
  const [props, rows] = await Promise.all([
    getTestimonialProps(accountId),
    getTestimonials(accountId),
  ]);
  return <Opiniones props={props} testimonials={aOpiniones(rows)} titulo={titulo} />;
}
