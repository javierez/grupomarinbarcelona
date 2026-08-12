"use client";

import { useEffect, useState } from "react";
import { TestimonialCarousel } from "~/components/testimonials/TestimonialCarousel";
import { TestimonialHeader } from "~/components/testimonials/TestimonialHeader";
import type { TestimonialProps } from "~/lib/data";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
}

export function PreviewTestimonialsClient({
  initialProps,
  testimonials,
}: {
  initialProps: TestimonialProps | null;
  testimonials: Testimonial[];
}) {
  const [props, setProps] = useState<TestimonialProps>(initialProps ?? {
    title: "Lo que dicen nuestros clientes",
    subtitle: "Testimonios reales de personas que confiaron en nosotros",
  } as TestimonialProps);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as
        | { type?: string; section?: string; patch?: Partial<TestimonialProps> }
        | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "testimonials"
      )
        return;
      setProps((prev) => ({ ...prev, ...(data.patch ?? {}) }));
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
