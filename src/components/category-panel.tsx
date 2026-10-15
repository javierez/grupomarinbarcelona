"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { staggerContainer, staggerItem } from "~/lib/animations";
import { isAccount139 } from "~/lib/account-overrides/139";

interface Category {
  title: string;
  subtitle: string;
  href: string;
  image: string;
}

const PROMOCIONES: Category = {
  title: "Promociones",
  subtitle: "Obra nueva y desarrollos",
  href: "/promociones",
  image: "/categories/promociones.jpg",
};

export interface CategoryPanelCardInput {
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string;
}

interface CategoryPanelMenuLabels {
  segundaMano?: string;
  inversion?: string;
  inversionSubtitle?: string;
  inversionHref?: string;
}

interface CategoryPanelProps {
  promotionsEnabled?: boolean;
  cards?: CategoryPanelCardInput[];
  menuLabels?: CategoryPanelMenuLabels;
}

export function CategoryPanel({
  promotionsEnabled = false,
  cards,
  menuLabels,
}: CategoryPanelProps) {
  // Default category cards (used when no DSL promo cards are configured). Labels
  // are config-driven via features_props.menuLabels; defaults preserve prior copy.
  const segundaMano: Category = {
    title: menuLabels?.segundaMano ?? "Segunda mano",
    subtitle: "Pisos y casas en venta",
    href: "/venta-propiedades/todas-ubicaciones",
    image: "/categories/segunda-mano.jpg",
  };
  const inversiones: Category = {
    title: menuLabels?.inversion ?? "Inversiones",
    subtitle: menuLabels?.inversionSubtitle ?? "Rentabilidad y oportunidad",
    href: menuLabels?.inversionHref ?? "/inversiones",
    image: "/categories/inversiones.jpg",
  };
  const CATEGORIES: Category[] =
    cards && cards.length > 0
      ? cards.map((c) => ({
          title: c.title,
          subtitle: c.subtitle,
          href: c.href,
          image: c.imageUrl,
        }))
      : [
          segundaMano,
          ...(promotionsEnabled ? [PROMOCIONES] : []),
          inversiones,
        ];
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className={isAccount139() ? "pb-0 pt-12 sm:pt-14 lg:pt-16" : "pb-0 pt-20 sm:pt-24 lg:pt-28"}>
      <div className="container">
        <motion.div
          className="flex flex-col gap-6 md:flex-row md:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {CATEGORIES.map((category, index) => (
            <motion.a
              key={category.title}
              href={category.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl md:aspect-auto md:h-[28rem] md:flex-1 md:basis-0"
              variants={staggerItem}
              animate={{
                flexGrow: hovered === null ? 1 : hovered === index ? 2 : 1,
              }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(index)}
              onBlur={() => setHovered(null)}
            >
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-6 pb-6 pt-16 sm:px-8 sm:pb-8">
                <h3 className="text-2xl font-medium tracking-tight text-white sm:text-3xl">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm text-white/85">
                  {category.subtitle}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-eyebrow text-white">
                  Explorar
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
