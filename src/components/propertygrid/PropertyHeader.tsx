"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "~/lib/animations";
import { useMinimalHeaders } from "~/components/header-style-context";

interface PropertyHeaderProps {
  title: string;
  subtitle: string;
}

export function PropertyHeader({ title, subtitle }: PropertyHeaderProps) {
  const minimal = useMinimalHeaders();
  return (
    <motion.div
      className="mb-12 flex flex-col items-start text-left"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
    >
      {!minimal && (
        <motion.span
          className="mb-4 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          Propiedades
        </motion.span>
      )}
      <motion.h2
        className="mb-4 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      {!minimal && (
        <motion.p
          className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
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