"use client";

import { motion } from "framer-motion";
import { RichAboutText } from "./RichAboutText";
import { useDescriptionAlign } from "~/components/header-style-context";
// import { fadeInUp } from "~/lib/animations";

interface MissionSectionProps {
  title: string;
  content: string;
}

export function MissionSection({
  title,
  content,
}: MissionSectionProps) {
  const align = useDescriptionAlign();
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h3
        className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {title}
      </motion.h3>
      <motion.div 
        className="space-y-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.2,
              delayChildren: 0.2
            }
          }
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <RichAboutText text={content} align={align} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
