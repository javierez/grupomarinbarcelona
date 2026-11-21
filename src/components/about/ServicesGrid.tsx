"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "~/components/ui/card";
import { staggerContainer, staggerItem } from "~/lib/animations";
import { getServiceIcon } from "~/lib/service-icons";
import { useAspectoV1 } from "~/components/header-style-context";

interface Service {
  title: string;
  icon: string;
}

interface ServicesGridProps {
  services: Service[];
  title: string;
  maxServicesDisplayed: number;
}

function IconCard({ title, icon, index }: Service & { index: number }) {
  // El catálogo vive en ~/lib/service-icons, generado a la vez que el selector
  // del CRM: lo que se puede elegir allí es exactamente lo que se pinta aquí.
  const IconComponent = getServiceIcon(icon);
  // v1: borderless card with a shadow.
  const v1 = useAspectoV1();
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      data-vesta="servicio"
      data-vesta-i={index}
      data-vesta-nombre={title}
    >
      <Card className={v1 ? "h-full border-none shadow-sm transition-shadow hover:shadow-md" : "h-full border border-border/60 bg-transparent shadow-none transition-colors hover:border-foreground/30"}>
        <CardContent className={v1 ? "flex items-center gap-2 p-3 sm:gap-3 sm:p-4" : "flex items-center gap-3 p-4 sm:p-5"}>
          <div className={v1 ? "flex-shrink-0 rounded-full bg-primary/10 p-1.5 sm:p-2" : "flex-shrink-0 rounded-full bg-brand/15 p-2.5"}>
            <IconComponent className={v1 ? "h-4 w-4 text-primary sm:h-5 sm:w-5" : "h-4 w-4 text-brand"} />
          </div>
          <span className="text-sm font-medium text-foreground sm:text-base">
            {title}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CardSection({
  title,
  items,
  max,
}: {
  title: string;
  items: Service[];
  max: number;
}) {
  const v1 = useAspectoV1();
  return (
    <motion.div
      data-vesta="servicios"
      className="space-y-3 sm:space-y-4"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <h3 className={v1 ? "text-xl font-semibold sm:text-2xl" : "text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"}>
        {title}
      </h3>
      <motion.div
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {items.slice(0, max).map((item, index) => (
          <IconCard key={index} index={index} title={item.title} icon={item.icon} />
        ))}
      </motion.div>
    </motion.div>
  );
}

export function ServicesGrid({
  services,
  title,
  maxServicesDisplayed,
}: ServicesGridProps) {
  return (
    <CardSection title={title} items={services} max={maxServicesDisplayed} />
  );
}
