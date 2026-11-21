/** How many photo dots are ever on screen, however many photos a listing has. */
const MAX_DOTS = 7;

/**
 * Classic position indicator: a fixed-width row of dots at the bottom of the
 * screen. Listings can have 50+ photos, so the row never grows past MAX_DOTS —
 * it slides along with the current slide and the dots at either end shrink to
 * signal there are more in that direction. When the first slide is a video its
 * dot is a ▶.
 */
export function FeedDots({
  total,
  current,
  firstIsVideo,
}: {
  total: number;
  current: number;
  firstIsVideo: boolean;
}) {
  if (total <= 1) return null;
  const visible = Math.min(MAX_DOTS, total);
  const start = Math.max(0, Math.min(current - Math.floor(visible / 2), total - visible));
  const window = Array.from({ length: visible }, (_, i) => start + i);

  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
      {window.map((index) => {
        const isActive = index === current;
        if (firstIsVideo && index === 0) {
          return (
            <span
              key={index}
              className={`text-[9px] leading-none transition-colors ${isActive ? "text-white" : "text-white/50"}`}
              aria-hidden
            >
              ▶
            </span>
          );
        }
        // A dot sitting at the window edge while more slides exist beyond it
        // renders smaller, the way TikTok/Instagram fade their ends.
        const isEdge =
          !isActive &&
          ((index === window[0] && index > 0) ||
            (index === window[window.length - 1] && index < total - 1));
        return (
          <div
            key={index}
            className={`rounded-full transition-all duration-200 ${
              isActive
                ? "h-2 w-2 bg-white"
                : isEdge
                  ? "h-1 w-1 bg-white/30"
                  : "h-1.5 w-1.5 bg-white/50"
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * Reels indicator: a thin bar across the top. On the video it tracks playback;
 * on photos it shows how far through the listing the visitor is, with a
 * "3 / 45" counter (one bar per photo is unreadable at 45 photos).
 */
export function FeedReelsProgress({
  total,
  current,
  firstIsVideo,
  videoProgress,
}: {
  total: number;
  current: number;
  firstIsVideo: boolean;
  videoProgress: number;
}) {
  const onVideo = firstIsVideo && current === 0;
  const photoCount = firstIsVideo ? total - 1 : total;
  const photoIndex = firstIsVideo ? current : current + 1;
  const fill = onVideo ? videoProgress : total > 0 ? (current + 1) / total : 0;

  return (
    <div className="pointer-events-none absolute left-4 right-16 top-4 z-30 flex items-center gap-3">
      <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-200 ease-linear"
          style={{ width: `${Math.min(100, fill * 100)}%` }}
        />
      </div>
      {!onVideo && photoCount > 1 && (
        <span className="text-[11px] font-medium tabular-nums text-white/85">
          {photoIndex} / {photoCount}
        </span>
      )}
    </div>
  );
}
