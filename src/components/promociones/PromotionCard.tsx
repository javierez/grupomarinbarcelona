"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Building2, Building, Home, Layers, ArrowRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { staggerItem } from "~/lib/animations";
import type { PromotionCardData } from "~/server/queries/promotions";
import { buildPromotionPriceLabel } from "./promotion-utils";

const TYPE_LABEL: Record<string, string> = {
  new_building: "Edificio nuevo",
  restored_building: "Edificio restaurado",
  house: "Casas",
  mixed_promos: "Mixto",
};

const TYPE_ICON: Record<string, typeof Building2> = {
  new_building: Building2,
  restored_building: Building,
  house: Home,
  mixed_promos: Layers,
};

interface Props {
  promotion: PromotionCardData;
  selected: boolean;
}

export function PromotionCard({ promotion, selected }: Props) {
  const typeLabel = promotion.newDevelopmentType
    ? TYPE_LABEL[promotion.newDevelopmentType] ?? "Promoción"
    : "Promoción";
  const TypeIcon = promotion.newDevelopmentType
    ? TYPE_ICON[promotion.newDevelopmentType] ?? Building2
    : Building2;
  const priceLabel = buildPromotionPriceLabel(
    promotion.minPrice,
    promotion.maxPrice,
  );

  const href = selected
    ? "/promociones"
    : `/promociones?promotion=${promotion.promotionId}`;

  return (
    <motion.div variants={staggerItem}>
      <Link
        href={href}
        scroll={false}
        className={cn(
          "group relative block aspect-[4/5] overflow-hidden rounded-2xl border transition-all",
          selected
            ? "border-foreground ring-2 ring-foreground/30"
            : "border-border/60 hover:border-foreground/40",
        )}
        aria-pressed={selected}
      >
        {promotion.mainImageUrl ? (
          <Image
            src={promotion.mainImageUrl}
            alt={promotion.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 bg-[linear-gradient(135deg,_#1f2937_0%,_#475569_55%,_#94a3b8_100%)]"
            aria-hidden
          />
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-transparent"
          aria-hidden
        />

        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-foreground backdrop-blur-sm">
          <TypeIcon className="h-3.5 w-3.5" />
          {typeLabel}
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent px-6 pb-6 pt-16 sm:px-8 sm:pb-7">
          <h3 className="text-2xl font-medium tracking-tight text-white sm:text-[1.6rem]">
            {promotion.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
            <span>
              {promotion.listingCount}{" "}
              {promotion.listingCount === 1 ? "unidad" : "unidades"}
            </span>
            {priceLabel && (
              <>
                <span className="text-white/50">·</span>
                <span>{priceLabel}</span>
              </>
            )}
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-eyebrow text-white">
            {selected ? "Quitar filtro" : "Ver propiedades"}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
