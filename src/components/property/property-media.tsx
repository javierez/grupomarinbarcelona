"use client";


interface MediaItem {
  id: string;
  url: string;
}

interface PropertyMediaProps {
  videos: MediaItem[];
  youtubeLinks: MediaItem[];
  virtualTours: MediaItem[];
}

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/embed/ID
 */
function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      // /embed/ID or /v/ID
      const embedMatch = /\/(embed|v)\/([^/?]+)/.exec(u.pathname);
      if (embedMatch?.[2]) return embedMatch[2];
      // ?v=ID
      return u.searchParams.get("v");
    }
  } catch {
    // not a valid URL
  }
  return null;
}

function MediaSection({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="mb-6 text-2xl font-medium tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function PropertyMedia({
  videos,
  youtubeLinks,
  virtualTours,
}: PropertyMediaProps) {
  const hasContent =
    videos.length > 0 || youtubeLinks.length > 0 || virtualTours.length > 0;

  if (!hasContent) return null;

  return (
    <div className="space-y-8">
      {videos.length > 0 && (
        <MediaSection
          title="Videos"
          eyebrow="Multimedia"
        >
          {videos.map((v) => (
            <div
              key={v.id}
              className="aspect-video w-full overflow-hidden rounded-xl border border-border/60"
            >
              <video
                src={v.url}
                controls
                preload="metadata"
                className="h-full w-full object-contain bg-black"
              />
            </div>
          ))}
        </MediaSection>
      )}

      {youtubeLinks.length > 0 && (
        <MediaSection
          title="YouTube"
          eyebrow="Multimedia"
        >
          {youtubeLinks.map((yt) => {
            const videoId = extractYouTubeId(yt.url);
            if (!videoId) return null;
            return (
              <div
                key={yt.id}
                className="aspect-video w-full overflow-hidden rounded-xl border border-border/60"
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
            );
          })}
        </MediaSection>
      )}

      {virtualTours.length > 0 && (
        <MediaSection
          title="Tour Virtual"
          eyebrow="Multimedia"
        >
          {virtualTours.map((tour) => (
            <div
              key={tour.id}
              className="aspect-video w-full overflow-hidden rounded-xl border border-border/60"
            >
              <iframe
                src={tour.url}
                title="Tour virtual"
                allow="fullscreen; vr; xr"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ))}
        </MediaSection>
      )}
    </div>
  );
}
