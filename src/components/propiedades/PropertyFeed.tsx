"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ListingCardData, FeedImage } from "~/server/queries/listings";
import { fetchFeedImages } from "~/server/actions/property-listing";
import { PropertyFeedCard } from "./PropertyFeedCard";
import { DEFAULT_VIDEO_DISPLAY, type VideoDisplay } from "~/lib/video-features";

/**
 * Two modes:
 * - route mode (`slugString` given): the `?vista=feed` view of the search
 *   results. Closing navigates back to the list. Historical behavior.
 * - overlay mode (`onClose` given): opened on top of another page (e.g. the
 *   homepage "Propiedades destacadas" teaser). Closing dismisses it in place,
 *   with a body scroll lock, Escape and browser/Android back all wired up.
 */
interface PropertyFeedProps {
  listings: ListingCardData[];
  watermarkEnabled: boolean;
  slugString?: string;
  currentSort?: string;
  /** Active free-text query, preserved when the feed closes. */
  query?: string;
  onClose?: () => void;
  /** Video options (features_props.video). Omitted = the original photo feed. */
  video?: VideoDisplay;
  /** Open scrolled to this listing (e.g. a tapped video on the homepage). */
  initialListingId?: string;
}

export function PropertyFeed({
  listings: inputListings,
  watermarkEnabled,
  slugString,
  currentSort,
  query,
  onClose,
  video = DEFAULT_VIDEO_DISPLAY,
  initialListingId,
}: PropertyFeedProps) {
  const router = useRouter();
  const isOverlay = !!onClose;
  // True once we pushed a history entry, so closing consumes it instead of
  // stranding it (and so cleanup can't double-pop).
  const pushedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageMap, setImageMap] = useState<Record<string, FeedImage[]>>({});
  const [, startTransition] = useTransition();
  const fetchedRef = useRef<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  // One sound setting for the whole feed, like Reels: unmute once and every
  // following video plays with sound.
  const [muted, setMuted] = useState(true);
  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  // "video-first": listings with a video lead the feed (stable, so the
  // visitor's sort still orders each group).
  const listings = useMemo(
    () =>
      video.feedMedia === "video-first"
        ? [
            ...inputListings.filter((l) => l.videoUrl),
            ...inputListings.filter((l) => !l.videoUrl),
          ]
        : inputListings,
    [inputListings, video.feedMedia],
  );

  // Fetch images for a batch of property IDs
  const loadImages = useCallback(
    (propertyIds: string[]) => {
      const newIds = propertyIds.filter((id) => !fetchedRef.current.has(id));
      if (newIds.length === 0) return;
      newIds.forEach((id) => fetchedRef.current.add(id));

      startTransition(async () => {
        const result = await fetchFeedImages(newIds);
        setImageMap((prev) => ({ ...prev, ...result }));
      });
    },
    [],
  );

  const initialIndex = Math.max(
    0,
    initialListingId
      ? listings.findIndex((l) => l.listingId.toString() === initialListingId)
      : 0,
  );

  // Load images for the first few properties on mount (from the item the feed
  // opens on).
  useEffect(() => {
    const initialIds = listings
      .slice(initialIndex, initialIndex + 3)
      .map((l) => l.propertyId.toString());
    loadImages(initialIds);
  }, [listings, loadImages, initialIndex]);

  // Open on the requested item.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || initialIndex === 0) return;
    container.scrollTop = initialIndex * container.clientHeight;
    setActiveIndex(initialIndex);
  }, [initialIndex]);

  // Which item is on screen — only that one's video plays.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-index"));
          if (!isNaN(index)) setActiveIndex(index);
        }
      },
      { root: container, threshold: 0.6 },
    );
    container.querySelectorAll("[data-index]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [listings]);

  // IntersectionObserver to preload images as user scrolls
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-index"));
          if (isNaN(index)) continue;
          // Preload current + next 2
          const idsToLoad = listings
            .slice(index, index + 3)
            .map((l) => l.propertyId.toString());
          loadImages(idsToLoad);
        }
      },
      { threshold: 0.3 },
    );

    const items = container.querySelectorAll("[data-index]");
    items.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [listings, loadImages]);

  const handleClose = useCallback(() => {
    if (onClose) {
      // Consume the history entry we pushed on open, so the browser's back
      // stack stays clean. `popstate` then triggers the actual close.
      if (pushedRef.current) {
        window.history.back();
        return;
      }
      onClose();
      return;
    }
    // Closing the feed returns to the grid — keep the active search so the user
    // doesn't land back on unfiltered results.
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    const sort = currentSort ?? "default";
    if (sort !== "default") params.set("sort", sort);
    const qs = params.toString();
    router.push(`/${slugString}${qs ? `?${qs}` : ""}`);
  }, [onClose, query, currentSort, slugString, router]);

  // Overlay mode only: lock the page behind, close on Escape, and make the
  // browser/Android back gesture dismiss the feed instead of leaving the site.
  // The pushed entry keeps the same URL, so the App Router resolves the same
  // route with no RSC fetch and no scroll jump.
  useEffect(() => {
    if (!onClose) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    const handlePopState = () => {
      pushedRef.current = false;
      onClose();
    };

    window.history.pushState(null, "", window.location.href);
    pushedRef.current = true;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose, handleClose]);

  return (
    <div className="fixed inset-0 z-[60] bg-black">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute right-4 top-4 z-50 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-colors hover:bg-black/60"
        aria-label="Cerrar vista feed"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {/* Vertical snap scroll container */}
      <div
        ref={containerRef}
        className={`h-[100dvh] snap-y snap-mandatory overflow-y-scroll overscroll-contain ${
          // Letterbox the reel on wide screens so portrait property photos
          // aren't cropped into panoramas. Full-bleed in route mode (mobile).
          // The adaptive desktop layout lays out each item itself.
          isOverlay && video.feedDesktop !== "adaptive" ? "mx-auto w-full max-w-[520px]" : ""
        }`}
        style={{ scrollbarWidth: "none" }}
      >
        {listings.map((listing, index) => (
          <div key={listing.listingId.toString()} data-index={index}>
            <PropertyFeedCard
              listing={listing}
              images={imageMap[listing.propertyId.toString()] ?? []}
              watermarkEnabled={watermarkEnabled}
              video={video}
              isActive={index === activeIndex}
              muted={muted}
              onToggleMute={toggleMute}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
