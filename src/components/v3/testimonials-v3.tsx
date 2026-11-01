"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { GoogleWordmark } from "./google-wordmark";

interface TestimonialV3 {
  id: string;
  name: string;
  content: string;
  avatar?: string;
}

interface TestimonialsV3Props {
  title: string;
  testimonials: TestimonialV3[];
  perPage: number;
  reviewsUrl?: string;
}

// Brand shade dark enough for body text on the grey card (the raw beige
// failed contrast).
// The `color:` hint tells tailwind-merge this is a colour; without it cn()
// takes it for a font size and drops the real size next to it.
const QUOTE_INK = "text-[color:color-mix(in_srgb,hsl(var(--brand))_60%,black)]";

function ReviewCard({ t }: { t: TestimonialV3 }) {
  return (
    <figure className="relative mt-14 flex min-h-[300px] flex-col rounded-md border border-border/70 bg-muted/60 px-5 pb-5 pt-20">
      <div className="absolute -top-14 left-1/2 h-[110px] w-[110px] -translate-x-1/2 rounded-full bg-background p-3.5">
        {t.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- small avatar, any host
          <img src={t.avatar} alt={t.name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-brand text-3xl font-normal text-brand-foreground">
            {t.name.trim().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <blockquote className={cn("flex-1 text-base font-light leading-snug", QUOTE_INK)}>
        “{t.content}”
      </blockquote>
      <figcaption className="mt-5 border-t border-border/60 pt-3 text-center text-sm font-light italic text-muted-foreground">
        {t.name}
      </figcaption>
    </figure>
  );
}

/**
 * `testimonial_props.cardStyle: "v3"`: the section title on a full-width brand
 * band, cards with the reviewer's photo sitting on their top edge, paged
 * with arrows and dots only when there is more than one page, and — with a
 * Google `reviewsUrl` — the Google wordmark, five stars and a link.
 */
export function TestimonialsV3({
  title,
  testimonials,
  perPage,
  reviewsUrl,
}: TestimonialsV3Props) {
  const size = Math.max(1, Math.min(perPage || 3, 3));
  const pages = Math.ceil(testimonials.length / size);
  const [page, setPage] = useState(0);
  const visible = testimonials.slice(page * size, page * size + size);
  const isGoogle = !!reviewsUrl && /google\./i.test(reviewsUrl);

  return (
    <section id="testimonials" className="mx-[calc(50%-50vw)]">
      <h2 className="bg-brand py-5 text-center text-[clamp(26px,3vw,40px)] font-normal uppercase text-brand-foreground">
        {title}
      </h2>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-center sm:grid-cols-[auto_1fr_auto] sm:gap-6">
          <button
            type="button"
            aria-label="Reseñas anteriores"
            onClick={() => setPage((p) => (p - 1 + pages) % pages)}
            className={cn("hidden text-brand transition-opacity hover:opacity-70 sm:block", pages < 2 && "sm:invisible")}
          >
            <ChevronLeft className="h-9 w-9" strokeWidth={1.2} />
          </button>
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-3 lg:gap-x-16">
            {visible.map((t) => (
              <ReviewCard key={t.id} t={t} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Reseñas siguientes"
            onClick={() => setPage((p) => (p + 1) % pages)}
            className={cn("hidden text-brand transition-opacity hover:opacity-70 sm:block", pages < 2 && "sm:invisible")}
          >
            <ChevronRight className="h-9 w-9" strokeWidth={1.2} />
          </button>
        </div>
        {pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Página ${i + 1}`}
                onClick={() => setPage(i)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  i === page ? "bg-brand" : "bg-brand/30",
                )}
              />
            ))}
          </div>
        )}
      </div>

      {reviewsUrl && (
        <div className="bg-muted/40 py-10 text-center">
          {isGoogle && (
            <>
              <GoogleWordmark className="mx-auto h-12 w-auto" />
              <p className="mt-2 text-xl tracking-wider text-[#f5a623]" aria-label="5 estrellas">
                ★★★★★
                <span className="ml-2 align-middle text-xl font-normal tracking-normal text-muted-foreground/70">
                  Reseñas
                </span>
              </p>
            </>
          )}
          <Button size="pill" className="mt-5" asChild>
            <a href={reviewsUrl} target="_blank" rel="noopener noreferrer">
              {isGoogle ? "Descubre más" : "Ver todas las reseñas"}
            </a>
          </Button>
        </div>
      )}
    </section>
  );
}
