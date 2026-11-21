"use client";

import { useEffect, useRef, type RefObject } from "react";
import Image from "next/image";

interface FeedSlidesProps {
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** Only set when the account shows videos in the feed ("video-first"). */
  videoUrl: string | null;
  imageUrls: string[];
  imageAlt: string;
  /** The video should be running: its item is on screen and it's the current slide. */
  playing: boolean;
  muted: boolean;
  onIndexChange: (index: number) => void;
  onVideoProgress: (fraction: number) => void;
  /** Reports whether the first slide is portrait, for the adaptive desktop layout. */
  onOrientation: (vertical: boolean) => void;
}

/**
 * The horizontal strip of one feed item: the video first (when there is one
 * and the account shows it), then the photos.
 */
export function FeedSlides({
  scrollerRef,
  videoUrl,
  imageUrls,
  imageAlt,
  playing,
  muted,
  onIndexChange,
  onVideoProgress,
  onOrientation,
}: FeedSlidesProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const totalSlides = imageUrls.length + (videoUrl ? 1 : 0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (totalSlides <= 1) return;
      const index = Math.round(el.scrollLeft / el.clientWidth);
      onIndexChange(Math.min(index, totalSlides - 1));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollerRef, totalSlides, onIndexChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) void video.play().catch(() => undefined);
    else video.pause();
  }, [playing]);

  return (
    <div
      ref={scrollerRef}
      // overflow-y-hidden matters: with only overflow-x set, the computed
      // overflow-y becomes "auto", so this scroller swallows vertical wheel /
      // drag gestures instead of letting them page the feed behind it.
      className="flex h-full w-full snap-x snap-mandatory overflow-x-scroll overflow-y-hidden"
      style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
    >
      {videoUrl && (
        <div className="relative h-full w-full flex-shrink-0 snap-start snap-always overflow-hidden bg-black">
          <video
            ref={videoRef}
            src={videoUrl}
            poster={imageUrls[0]}
            muted={muted}
            loop
            playsInline
            preload="none"
            className="h-full w-full object-cover"
            onLoadedMetadata={(e) =>
              onOrientation(e.currentTarget.videoHeight >= e.currentTarget.videoWidth)
            }
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) onVideoProgress(v.currentTime / v.duration);
            }}
          />
        </div>
      )}
      {imageUrls.length > 0 ? (
        imageUrls.map((url, i) => (
          <div
            key={i}
            className="relative h-full w-full flex-shrink-0 snap-start snap-always overflow-hidden bg-neutral-950"
          >
            {/* Property photos are landscape but the card is a portrait
                viewport. `object-cover` cropped the sides away, so the photo
                is contained in full, with a zoomed blurred copy filling the
                letterbox behind it. */}
            <Image
              src={url}
              alt=""
              aria-hidden
              fill
              className="scale-110 object-cover blur-2xl brightness-[0.55]"
              sizes="100vw"
              priority={i === 0 && !videoUrl}
              loading={i === 0 ? "eager" : "lazy"}
            />
            <Image
              src={url}
              alt={`${imageAlt} - Foto ${i + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority={i === 0 && !videoUrl}
              loading={i === 0 ? "eager" : "lazy"}
              onLoad={
                i === 0 && !videoUrl
                  ? (e) =>
                      onOrientation(
                        e.currentTarget.naturalHeight > e.currentTarget.naturalWidth,
                      )
                  : undefined
              }
            />
          </div>
        ))
      ) : (
        !videoUrl && (
          <div className="flex h-full w-full items-center justify-center bg-foreground">
            <span className="text-xs font-medium uppercase tracking-eyebrow text-white/60">
              Sin fotos
            </span>
          </div>
        )
      )}
    </div>
  );
}
