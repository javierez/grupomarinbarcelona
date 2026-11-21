"use client";

import { motion } from "framer-motion";
import { RichAboutText } from "./RichAboutText";
import {
  descriptionAlignClass,
  useAspectoV1,
  useDescriptionAlign,
} from "~/components/header-style-context";
import { cn } from "~/lib/utils";
// import { fadeInUp } from "~/lib/animations";

/** v1 (`aspectoV1`): the vision text at body size, in grey, in ONE <p> per
 * text like the v1 did: its line breaks collapse into spaces (Burgo Nuevo's
 * «Nuestra visión» is four lines that the v1 shows as one paragraph). */
const V1_TEXTO = "leading-relaxed text-muted-foreground";

interface MissionSectionProps {
  title: string;
  content: string;
  /** v1 look: the second text goes here, under the first, not in its own box. */
  content2?: string;
}

export function MissionSection({
  title,
  content,
  content2,
}: MissionSectionProps) {
  const align = useDescriptionAlign();
  const v1 = useAspectoV1();
  return (
    <motion.div 
      data-vesta="nosotros.texto"
      className="space-y-4"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h3
        className={v1 ? "text-2xl font-semibold" : "text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"}
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
          {v1 ? (
            <p className={cn(V1_TEXTO, descriptionAlignClass(align))}>{content}</p>
          ) : (
            <RichAboutText text={content} align={align} />
          )}
        </motion.div>
        {content2 && (
          <motion.div
            data-vesta="nosotros.texto2"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 }
            }}
          >
            {v1 ? (
              <p className={cn(V1_TEXTO, descriptionAlignClass(align))}>{content2}</p>
            ) : (
              <RichAboutText text={content2} align={align} />
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
