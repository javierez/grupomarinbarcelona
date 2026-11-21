"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "~/lib/animations";
import { useAspectoV1, useMinimalHeaders } from "~/components/header-style-context";
import type { Clave } from "~/lib/seleccion-claves";

interface PropertyHeaderProps {
  title: string;
  subtitle: string;
  /** Qué son el título y el subtitulo al señalarlos desde «Mi web» (§6.1). */
  vesta: { titulo: Clave; subtitulo?: Clave };
}

export function PropertyHeader({ title, subtitle, vesta }: PropertyHeaderProps) {
  const minimal = useMinimalHeaders();
  // v1: centred bold title and its subtitle, no kicker.
  const v1 = useAspectoV1();
  return (
    <motion.div
      className={v1 ? "mb-8 text-center" : "mb-12 flex flex-col items-start text-left"}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={fadeInUp}
    >
      {!minimal && !v1 && (
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
        data-vesta={vesta.titulo}
        className={v1 ? "mb-2 text-4xl font-bold" : "mb-4 max-w-3xl text-4xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      {!minimal && (
        <motion.p
          data-vesta={vesta.subtitulo}
          className={v1 ? "mx-auto max-w-2xl text-muted-foreground" : "max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"}
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