"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "~/lib/animations";

interface KpiData {
  name: string;
  data: string;
}

interface KpiSectionProps {
  kpis: KpiData[];
}

export function KpiSection({ kpis }: KpiSectionProps) {
  if (!kpis.length) return null;

  return (
    <motion.div
      className="mt-28 grid grid-cols-2 gap-10 border-t border-border/60 pt-16 text-left md:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      {kpis.map((kpi, index) => (
        <motion.div
          key={index}
          className="space-y-3"
          variants={staggerItem}
        >
          <motion.h3
            className="font-display text-5xl font-light italic leading-none tracking-tight text-foreground sm:text-6xl"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: index * 0.08,
            }}
          >
            {kpi.data.endsWith("+")
              ? `+${kpi.data.slice(0, -1)}`
              : kpi.data}
          </motion.h3>
          <motion.p
            className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + index * 0.08 }}
          >
            {kpi.name}
          </motion.p>
        </motion.div>
      ))}
    </motion.div>
  );
}
