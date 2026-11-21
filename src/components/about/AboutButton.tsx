"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { fadeInUp } from "~/lib/animations";
import { useAspectoV1 } from "~/components/header-style-context";

interface AboutButtonProps {
  text: string;
  href: string;
}

export function AboutButton({ text, href }: AboutButtonProps) {
  const v1 = useAspectoV1();
  return (
    <motion.div 
      data-vesta="nosotros.boton"
      className="mt-12 flex flex-col justify-center gap-4 sm:flex-row"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="inline-block"
      >
        <Button size={v1 ? "lg" : "pill"} asChild>
          <Link href={href}>{text}</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
}
