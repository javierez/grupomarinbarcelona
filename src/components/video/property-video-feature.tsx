"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";

interface PropertyVideoFeatureProps {
  videoUrl: string;
  poster?: string;
  photoCount: number;
  /** The photo gallery, rendered next to (desktop) or instead of (mobile) the video. */
  children: React.ReactNode;
}

const iconButton =
  "grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70";

/**
 * Property page "featured" video layout (features_props.video.propertyLayout).
 * Desktop: the video in its own vertical column beside the photo gallery.
 * Mobile: the video is the cover, with a Vídeo / Fotos switch. It plays muted
 * while on screen, with its own play, sound and full-screen controls.
 */
export function PropertyVideoFeature({
  videoUrl,
  poster,
  photoCount,
  children,
}: PropertyVideoFeatureProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<"video" | "photos">("video");
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(!!entry?.isIntersecting),
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Plays only while visible, not paused by the visitor, and (on mobile) while
  // the Vídeo tab is selected — the box is display:none on the Fotos tab.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView && !paused && mode === "video") void v.play().catch(() => undefined);
    else v.pause();
  }, [inView, paused, mode]);

  const tabs = (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 rounded-full bg-black/55 p-1 backdrop-blur-md lg:hidden">
      {(["video", "photos"] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
            mode === m ? "bg-white text-neutral-900" : "text-white"
          }`}
        >
          {m === "video" ? "▶ Vídeo" : `Fotos (${photoCount})`}
        </button>
      ))}
    </div>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-4">
      <div
        ref={boxRef}
        className={`relative aspect-[9/13] overflow-hidden rounded-xl bg-black lg:aspect-auto lg:h-full lg:min-h-[420px] ${
          mode === "video" ? "block" : "hidden lg:block"
        }`}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          poster={poster}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
          onClick={() => setPaused((p) => !p)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration) setProgress(v.currentTime / v.duration);
          }}
        />
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-eyebrow text-neutral-900">
          Recorrido en vídeo
        </span>
        <div className="absolute inset-x-3 bottom-16 flex items-center gap-2 lg:bottom-3">
          <button
            type="button"
            className={iconButton}
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Reproducir" : "Pausar"}
          >
            {paused ? <Play className="ml-0.5 h-4 w-4 fill-white" /> : <Pause className="h-4 w-4 fill-white" />}
          </button>
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
            <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
          </div>
          <button
            type="button"
            className={iconButton}
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => void videoRef.current?.requestFullscreen?.().catch(() => undefined)}
            aria-label="Ver a pantalla completa"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        {tabs}
      </div>

      <div className={mode === "photos" ? "block" : "hidden lg:block"}>
        {/* Way back to the video on mobile once the visitor is on the photos. */}
        <button
          type="button"
          onClick={() => setMode("video")}
          className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/60 px-4 py-1.5 text-xs font-medium text-foreground lg:hidden"
        >
          <Play className="h-3 w-3 fill-foreground" aria-hidden />
          Ver el vídeo
        </button>
        {children}
      </div>
    </div>
  );
}
