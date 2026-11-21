"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { fadeInUp } from "~/lib/animations";
import { useAspectoV1 } from "~/components/header-style-context";

interface PropertyButtonProps {
  text: string;
  onClick?: () => void;
}

export function PropertyButton({ text, onClick }: PropertyButtonProps) {
  const router = useRouter();
  // v1: centred, a square-cornered button.
  const v1 = useAspectoV1();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push("/venta-propiedades/todas-ubicaciones");
    }
  };

  return (
    <motion.div
      className={v1 ? "mt-12 flex justify-center" : "mt-16 flex justify-start"}
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
        <Button size={v1 ? "lg" : "pill"} variant="default" onClick={handleClick} data-vesta="destacados.boton">
          {text}
        </Button>
      </motion.div>
    </motion.div>
  );
}