"use client";

import { useState } from "react";
import { Check, Images, Share2, Volume2, VolumeX } from "lucide-react";

function RailButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={label}
        className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25"
      >
        {children}
      </button>
      <span className="text-[10px] font-medium text-white/90">{label}</span>
    </div>
  );
}

/** Right-hand action rail of the reels style: sound, photos, share. */
export function FeedReelsRail({
  hasVideo,
  muted,
  onToggleMute,
  photoCount,
  onShowPhotos,
  shareUrl,
  shareTitle,
}: {
  hasVideo: boolean;
  muted: boolean;
  onToggleMute: () => void;
  photoCount: number;
  onShowPhotos: () => void;
  shareUrl: string;
  shareTitle: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = new URL(shareUrl, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The visitor closed the share sheet — nothing to do.
    }
  };

  return (
    <div className="absolute bottom-40 right-3 z-30 flex flex-col gap-4">
      {hasVideo && (
        <RailButton label={muted ? "Sonido" : "Silenciar"} onClick={onToggleMute}>
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </RailButton>
      )}
      {photoCount > 0 && (
        <RailButton label={`${photoCount} fotos`} onClick={onShowPhotos}>
          <Images className="h-5 w-5" />
        </RailButton>
      )}
      <RailButton label={copied ? "Copiado" : "Compartir"} onClick={() => void share()}>
        {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
      </RailButton>
    </div>
  );
}
