"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import type { ListingCardData, FeedImage } from "~/server/queries/listings";
import { getWatermarkedImageUrl } from "~/lib/image-url";
import { buildPropertyImageAlt } from "~/lib/property-slug";
import { DEFAULT_VIDEO_DISPLAY, type VideoDisplay } from "~/lib/video-features";
import { FeedSlides } from "./feed/feed-slides";
import { FeedDots, FeedReelsProgress } from "./feed/feed-progress";
import { FeedActions, FeedBadges, FeedDetails, feedListingHref } from "./feed/feed-details";
import { FeedReelsRail } from "./feed/feed-reels-rail";

interface PropertyFeedCardProps {
  listing: ListingCardData;
  images: FeedImage[];
  watermarkEnabled: boolean;
  /** Feed video options. Omitted = the original photo-only feed. */
  video?: VideoDisplay;
  /** This item is the one on screen (drives video playback). */
  isActive?: boolean;
  muted?: boolean;
  onToggleMute?: () => void;
}

export function PropertyFeedCard({
  listing,
  images,
  watermarkEnabled,
  video = DEFAULT_VIDEO_DISPLAY,
  isActive = false,
  muted = true,
  onToggleMute,
}: PropertyFeedCardProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [flash, setFlash] = useState<"play" | "pause" | null>(null);

  // Build image list: use fetched images, fallback to listing's 2 images
  const imageUrls =
    images.length > 0
      ? images.map((img) => getWatermarkedImageUrl(img.imageUrl, watermarkEnabled))
      : [
          getWatermarkedImageUrl(listing.imageUrl, watermarkEnabled),
          getWatermarkedImageUrl(listing.imageUrl2, watermarkEnabled),
        ].filter(Boolean);

  const videoUrl =
    video.feedMedia === "video-first" ? (listing.videoUrl ?? null) : null;
  const hasVideo = !!videoUrl;
  const totalSlides = imageUrls.length + (hasVideo ? 1 : 0);
  const onVideoSlide = hasVideo && currentIndex === 0;

  // Videos are portrait until their metadata says otherwise; photos landscape
  // until the first one loads.
  const [isVertical, setIsVertical] = useState(hasVideo);
  const adaptive = video.feedDesktop === "adaptive" && isVertical;
  const reels = video.feedStyle === "reels";

  const imageAlt = buildPropertyImageAlt({
    title: listing.title,
    propertyType: listing.propertyType,
    propertySubtype: listing.propertySubtype,
    city: listing.city,
    bedrooms: listing.bedrooms,
    squareMeter: listing.squareMeter,
    listingType: listing.listingType,
  });

  // Leaving an item un-pauses it, so coming back plays again.
  useEffect(() => {
    if (!isActive) setPaused(false);
  }, [isActive]);

  const handleIndexChange = useCallback((index: number) => setCurrentIndex(index), []);

  const togglePause = (e: React.MouseEvent) => {
    if (!onVideoSlide || (e.target as HTMLElement).closest("a,button")) return;
    setPaused((p) => !p);
    setFlash(paused ? "play" : "pause");
    setTimeout(() => setFlash(null), 600);
  };

  const showPhotos = () => {
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: hasVideo ? el.clientWidth : 0, behavior: "smooth" });
  };

  return (
    <div
      className={`relative h-[100dvh] w-full snap-start snap-always ${
        adaptive ? "lg:flex lg:items-center lg:justify-center lg:gap-12 lg:px-10" : ""
      }`}
    >
      {/* Media box: the whole screen, or a 9:16 column on desktop when the
          account uses the adaptive layout and this item is vertical. */}
      <div
        className={
          adaptive
            ? "absolute inset-0 lg:relative lg:inset-auto lg:aspect-[9/16] lg:h-[calc(100dvh-5rem)] lg:overflow-hidden lg:rounded-2xl"
            : "absolute inset-0"
        }
        onClick={togglePause}
      >
        <FeedSlides
          scrollerRef={scrollerRef}
          videoUrl={videoUrl}
          imageUrls={imageUrls}
          imageAlt={imageAlt}
          playing={isActive && onVideoSlide && !paused}
          muted={muted}
          onIndexChange={handleIndexChange}
          onVideoProgress={setVideoProgress}
          onOrientation={setIsVertical}
        />

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {flash && (
          <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-black/45">
              {flash === "pause" ? (
                <Pause className="h-7 w-7 fill-white text-white" />
              ) : (
                <Play className="ml-1 h-7 w-7 fill-white text-white" />
              )}
            </div>
          </div>
        )}

        {reels ? (
          <>
            <FeedReelsProgress
              total={totalSlides}
              current={currentIndex}
              firstIsVideo={hasVideo}
              videoProgress={videoProgress}
            />
            <FeedReelsRail
              hasVideo={hasVideo}
              muted={muted}
              onToggleMute={() => onToggleMute?.()}
              photoCount={imageUrls.length}
              onShowPhotos={showPhotos}
              shareUrl={feedListingHref(listing)}
              shareTitle={listing.title ?? "Propiedad"}
            />
          </>
        ) : (
          <>
            <FeedDots total={totalSlides} current={currentIndex} firstIsVideo={hasVideo} />
            {onVideoSlide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMute?.();
                }}
                aria-label={muted ? "Activar sonido" : "Silenciar"}
                className="absolute left-4 top-4 z-30 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            )}
          </>
        )}

        {/* Property info overlay. On the adaptive desktop layout it moves to
            the side panel instead. pb leaves room for the dot row. */}
        <div
          className={`absolute bottom-0 left-0 z-10 p-6 ${reels ? "right-16 pb-8 lg:max-w-xl" : "right-0 pb-12"} ${
            adaptive ? "lg:hidden" : ""
          }`}
        >
          <FeedBadges listing={listing} />
          <FeedDetails listing={listing} />
          {reels && <FeedActions listing={listing} />}
        </div>
      </div>

      {adaptive && (
        <aside className="hidden w-[380px] lg:block">
          <FeedBadges listing={listing} />
          <FeedDetails listing={listing} variant="panel" />
          <FeedActions listing={listing} />
        </aside>
      )}
    </div>
  );
}
