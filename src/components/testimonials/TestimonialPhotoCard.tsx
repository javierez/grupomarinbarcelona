"use client";

import Image from "next/image";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
}

interface TestimonialPhotoCardProps {
  testimonial: Testimonial;
}

/**
 * The "foto de fondo" design: the client's photo fills the card, a dark
 * gradient carries the text, and everything sits in white on top.
 *
 * Only rendered when the testimonial actually has a photo — the carousel falls
 * back to the classic `TestimonialCard` when it doesn't, because this layout
 * with an empty grey rectangle looks broken rather than minimal.
 *
 * Editorial variant: square corners, eyebrow-cased role, quieter star fill —
 * the same restraint as the v2 `TestimonialCard`.
 */
export function TestimonialPhotoCard({ testimonial }: TestimonialPhotoCardProps) {
  const rating = testimonial.rating ?? 5;

  return (
    <div className="group relative flex h-full min-h-[440px] flex-col justify-end overflow-hidden rounded-2xl bg-foreground">
      {testimonial.avatar && (
        <Image
          src={testimonial.avatar}
          alt={testimonial.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}

      {/* Legibility gradient — dense at the bottom where the text sits */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" />

      <div className="relative z-10 flex flex-col gap-5 p-8">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < rating
                  ? "fill-white text-white"
                  : "fill-white/20 text-white/20"
              }`}
            />
          ))}
        </div>

        <p className="text-base leading-relaxed text-white/95">
          &ldquo;{testimonial.content}&rdquo;
        </p>

        <div className="border-t border-white/20 pt-5">
          <h4 className="text-sm font-medium text-white">{testimonial.name}</h4>
          {testimonial.role && (
            <p className="text-xs font-medium uppercase tracking-eyebrow text-white/60">
              {testimonial.role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
