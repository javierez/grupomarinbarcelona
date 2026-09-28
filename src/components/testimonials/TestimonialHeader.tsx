"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "~/lib/animations";
import { useMinimalHeaders } from "~/components/header-style-context";

interface TestimonialHeaderProps {
  title: string;
  subtitle: string;
}

export function TestimonialHeader({ title, subtitle }: TestimonialHeaderProps) {
  const minimal = useMinimalHeaders();
  return (
    <motion.div
      className="mb-16 flex flex-col items-center text-center"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
    >
      {!minimal && (
        <motion.span
          className="mb-5 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Testimonios
        </motion.span>
      )}
      <motion.h2
        className="mb-6 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      {!minimal && (
        <motion.p
          className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
