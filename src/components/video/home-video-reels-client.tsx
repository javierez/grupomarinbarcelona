"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Play } from "lucide-react";
import type { ListingCardData } from "~/server/queries/listings";
import { PropertyFeed } from "~/components/propiedades/PropertyFeed";
import { getWatermarkedImageUrl } from "~/lib/image-url";
import { formatPrice, resolvePriceDisplay } from "~/lib/utils";
import { isRentalListingType } from "~/lib/listing-types";
import type { VideoDisplay } from "~/lib/video-features";

interface HomeVideoReelsClientProps {
  listings: ListingCardData[];
  title: string;
  subtitle: string;
  watermarkEnabled: boolean;
  video: VideoDisplay;
}

function priceLabel(listing: ListingCardData): string | null {
  const isRental = isRentalListingType(listing.listingType);
  const display = resolvePriceDisplay({
    price: listing.price,
    hidePrice: listing.hidePrice,
    status: listing.status,
    isRental,
  });
  if (display.mode === "hidden") return null;
  const num = Number(listing.price);
  if (display.mode === "consult" || !num) return "A consultar";
  return `${formatPrice(num)}€${isRental ? "/mes" : ""}`;
}

/** One vertical card. Desktop plays the video muted on hover. */
function ReelCard({
  listing,
  poster,
  onOpen,
}: {
  listing: ListingCardData;
  poster: string;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const price = priceLabel(listing);

  const start = () => {
    const v = ref.current;
    if (!v || !window.matchMedia("(hover: hover)").matches) return;
    if (!v.getAttribute("src") && listing.videoUrl) v.src = listing.videoUrl;
    v.play().then(() => setPlaying(true)).catch(() => undefined);
  };
  const stop = () => {
    ref.current?.pause();
    setPlaying(false);
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={start}
      onMouseLeave={stop}
      aria-label={`Ver vídeo: ${listing.title ?? "propiedad"}`}
      className="group relative aspect-[9/16] w-40 flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-neutral-900 text-left sm:w-48 lg:w-auto"
    >
      {poster && (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(max-width: 1024px) 192px, 16vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${playing ? "opacity-100" : "opacity-0"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-white backdrop-blur-sm">
        <Play className="h-2.5 w-2.5 fill-white" aria-hidden />
        Vídeo
      </span>
      <div className="absolute inset-x-3 bottom-3 text-white">
        {listing.city && (
          <span className="block text-[10px] font-medium uppercase tracking-eyebrow text-white/75">
            {listing.city}
          </span>
        )}
        <span className="mt-1 line-clamp-2 block text-sm font-medium leading-tight">
          {listing.title ?? "Propiedad"}
        </span>
        {price && <span className="mt-1 block text-lg font-medium tracking-tight">{price}</span>}
      </div>
    </button>
  );
}

export function HomeVideoReelsClient({
  listings,
  title,
  subtitle,
  watermarkEnabled,
  video,
}: HomeVideoReelsClientProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <section className="py-16 sm:py-20" aria-label={title}>
      <div className="mb-8">
        <span className="mb-4 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
          Vídeo
        </span>
        <h2 className="max-w-3xl text-3xl font-medium leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {/* A swipeable row on phones; a grid of up to six on desktop. */}
      <div
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0"
        style={{ scrollbarWidth: "none" }}
      >
        {listings.map((listing) => (
          <ReelCard
            key={listing.listingId.toString()}
            listing={listing}
            poster={getWatermarkedImageUrl(listing.imageUrl, watermarkEnabled)}
            onOpen={() => setOpenId(listing.listingId.toString())}
          />
        ))}
      </div>

      {/* Portalled for the same reason as FeaturedFeedButton: a transformed
          ancestor would trap the feed's position: fixed. */}
      {isMounted &&
        openId &&
        createPortal(
          <PropertyFeed
            listings={listings}
            watermarkEnabled={watermarkEnabled}
            video={video}
            initialListingId={openId}
            onClose={() => setOpenId(null)}
          />,
          document.body,
        )}
    </section>
  );
}
