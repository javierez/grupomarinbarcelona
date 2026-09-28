"use client";

import { useEffect, useState } from "react";
import { TestimonialCarousel } from "~/components/testimonials/TestimonialCarousel";
import { TestimonialHeader } from "~/components/testimonials/TestimonialHeader";
import type { TestimonialProps } from "~/lib/data";
import { announceReady, readPreviewMessage, slice } from "./preview-patch";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
}

/** Slice names the editor sends. Order matters: the first is the bare shape. */
const KEYS = ["testimonialProps", "testimonials"] as const;

const FALLBACK = {
  title: "Lo que dicen nuestros clientes",
  subtitle: "Testimonios reales de personas que confiaron en nosotros",
} as TestimonialProps;

/**
 * The testimonios section, live.
 *
 * The list used to be a server prop the editor could not touch: an agency
 * changed a testimonio's description or photo and this section sat unchanged
 * until someone reloaded the frame. It is state now, and the editor sends the
 * rows alongside the section settings.
 */
export function PreviewTestimonialsClient({
  initialProps,
  testimonials: initialTestimonials,
}: {
  initialProps: TestimonialProps | null;
  testimonials: Testimonial[];
}) {
  const [props, setProps] = useState<TestimonialProps>(
    initialProps ?? FALLBACK,
  );
  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(initialTestimonials);

  useEffect(() => {
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e.data, "testimonials");
      if (!msg) return;

      const nextProps = slice<Partial<TestimonialProps>>(
        msg.patch,
        "testimonialProps",
        KEYS,
      );
      if (nextProps) setProps((prev) => ({ ...prev, ...nextProps }));

      // Only replace the list when the editor actually sent one — an older CRM
      // sends the props alone, and clearing the section then would be a
      // regression dressed up as a feature.
      const nextList = slice<Testimonial[]>(msg.patch, "testimonials", KEYS);
      if (Array.isArray(nextList)) setTestimonials(nextList);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <section className="py-16">
      <div className="container">
        <TestimonialHeader
          title={props.title ?? "Testimonios"}
          subtitle={props.subtitle ?? ""}
        />
        {testimonials.length > 0 ? (
          <TestimonialCarousel
            testimonials={testimonials}
            cardStyle={props.cardStyle ?? "avatar"}
          />
        ) : (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            No hay testimonios configurados.
          </p>
        )}
      </div>
    </section>
  );
}
