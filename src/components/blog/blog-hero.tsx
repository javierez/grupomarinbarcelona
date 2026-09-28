"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface BlogHeroProps {
  /** Small label above the title — the section name, or the post's category. */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image?: string | null;
  imageAlt?: string;
  /** When set the whole hero is a link to the article. */
  href?: string;
  ctaLabel?: string;
  /** Date · read time, rendered as the meta rail under the title. */
  meta?: string[];
}

/**
 * The blog opens with its lead story rather than a generic banner: full-bleed
 * cover image, title anchored low-left, meta rail beneath. Falls back to a flat
 * brand panel when the account has no cover image yet.
 */
export function BlogHero({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt = "",
  href,
  ctaLabel = "Leer artículo",
  meta = [],
}: BlogHeroProps) {
  const reduceMotion = useReducedMotion();
  const rise = reduceMotion ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

  const content = (
    <>
      {image ? (
        <>
          <div className="absolute inset-0 z-0">
            <Image
              src={image}
              alt={imageAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
              unoptimized
            />
          </div>
          {/* Two stacked scrims: a soft overall tint for the eyebrow row, and a
              stronger bottom gradient so the title always clears its backdrop. */}
          <div className="absolute inset-0 z-[1] bg-black/25" />
          <div className="absolute inset-x-0 bottom-0 z-[1] h-3/4 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 z-0 bg-brand" />
      )}

      <div className="container relative z-10 mx-auto w-full px-4 pb-14 pt-32 sm:px-6 sm:pb-20 sm:pt-40">
        <div className="max-w-4xl">
          {eyebrow && (
            <motion.span
              {...rise}
              transition={{ duration: 0.5 }}
              className="block text-xs font-medium uppercase tracking-eyebrow text-white/75"
            >
              {eyebrow}
            </motion.span>
          )}

          <motion.h1
            {...rise}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-balance text-3xl font-medium leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl"
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              {...rise}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg"
            >
              {subtitle}
            </motion.p>
          )}

          {(meta.length > 0 || href) && (
            <motion.div
              {...rise}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs uppercase tracking-eyebrow text-white/70"
            >
              {meta.map((item, index) => (
                <span key={item} className="flex items-center gap-5">
                  {index > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-white/40" />}
                  <span className="tabular-nums">{item}</span>
                </span>
              ))}
              {href && (
                <span className="flex items-center gap-2 text-white">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </>
  );

  const shell =
    "group relative -mt-20 flex min-h-[70vh] items-end overflow-hidden sm:-mt-24 sm:min-h-[82vh]";

  return href ? (
    <Link href={href} className={shell} aria-label={title}>
      {content}
    </Link>
  ) : (
    <section className={shell}>{content}</section>
  );
}
