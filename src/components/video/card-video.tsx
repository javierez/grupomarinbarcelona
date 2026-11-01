"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { Badge } from "~/components/ui/badge";

/** Which of the card video options the account turned on. */
export type CardVideoOptions = { badge: boolean; preview: boolean };

/** "▶ Vídeo" pill for cards whose listing has an uploaded video. */
export function CardVideoBadge({ className = "" }: { className?: string }) {
  return (
    <Badge
      className={`z-10 flex items-center gap-1 rounded-full border-0 bg-black/65 px-2.5 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-white backdrop-blur-sm hover:bg-black/65 ${className}`}
    >
      <Play className="h-2.5 w-2.5 fill-white" aria-hidden />
      Vídeo
    </Badge>
  );
}

/**
 * The listing's video, muted, laid over the card photo while the card is
 * hovered. Desktop only: touch screens have no hover, and loading a video per
 * card on a phone would burn the visitor's data. The file is only requested on
 * the first hover (`preload="none"` + src set lazily).
 */
export function CardHoverVideo({ src, active }: { src: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [canHover, setCanHover] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !canHover) return;
    if (active) {
      if (!video.getAttribute("src")) video.src = src;
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [active, canHover, src]);

  if (!canHover) return null;

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
      className={`absolute inset-0 z-[1] h-full w-full object-cover transition-opacity duration-300 ${
        playing ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
