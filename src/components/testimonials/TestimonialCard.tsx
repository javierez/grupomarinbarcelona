"use client";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const rating = testimonial.rating || 5;

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-8 transition-colors duration-300 hover:border-foreground/30">
      {/* Star rating at top - editorial accent */}
      <div className="mb-6 flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 transition-colors duration-200 ${
              i < rating
                ? "fill-foreground text-foreground"
                : "fill-border text-border"
            }`}
          />
        ))}
      </div>

      {/* Testimonial Content */}
      <p className="flex-1 text-base leading-relaxed text-foreground/85">
        “{testimonial.content}”
      </p>

      {/* Footer: avatar + name + role */}
      <div className="mt-8 flex items-center gap-3 border-t border-border/60 pt-6">
        <Avatar className="h-11 w-11 flex-shrink-0">
          {testimonial.avatar && (
            <AvatarImage
              src={testimonial.avatar}
              alt={testimonial.name}
              className="object-cover"
            />
          )}
          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-foreground">
            {testimonial.name}
          </h4>
          {testimonial.role && (
            <p className="truncate text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              {testimonial.role}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
