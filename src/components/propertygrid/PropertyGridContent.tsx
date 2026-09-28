"use client";

import { motion } from "framer-motion";
import type { ListingCardData } from "~/server/queries/listings";
import { PropertyCard } from "~/components/listing-card";
import type { CardDisplayConfig } from "~/lib/card-display";
import { staggerContainer } from "~/lib/animations";

interface PropertyGridContentProps {
  listings: ListingCardData[];
  watermarkEnabled?: boolean;
  showDescription?: boolean;
  showReference?: boolean;
  cardDisplay?: CardDisplayConfig;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};

export function PropertyGridContent({ listings, watermarkEnabled = false, showDescription = true, showReference = true, cardDisplay }: PropertyGridContentProps) {
  return (
    <motion.div
      className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-10"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {listings.map((listing, index) => (
        <motion.div
          key={listing.listingId.toString()}
          variants={cardVariants}
        >
          <PropertyCard listing={listing} index={index} watermarkEnabled={watermarkEnabled} showDescription={showDescription} showReference={showReference} cardDisplay={cardDisplay} />
        </motion.div>
      ))}
    </motion.div>
  );
}