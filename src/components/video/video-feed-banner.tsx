import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";

/**
 * "Ver en vídeo" banner above the search results: opens Descubre with only the
 * listings of this search that have a video. Rendered only when the account
 * turned it on (features_props.video.resultsBanner) and there is something to
 * show.
 */
export function VideoFeedBanner({
  href,
  count,
  posters,
}: {
  href: string;
  count: number;
  posters: string[];
}) {
  return (
    <Link
      href={href}
      className="group mb-10 flex items-center gap-4 rounded-2xl bg-foreground px-4 py-3.5 text-background transition-opacity hover:opacity-95 sm:px-5"
    >
      {posters.length > 0 && (
        <div className="flex flex-shrink-0">
          {posters.slice(0, 4).map((src, i) => (
            <div
              key={src}
              className={`relative h-14 w-9 overflow-hidden rounded-md border-2 border-foreground ${i > 0 ? "-ml-3" : ""}`}
            >
              <Image src={src} alt="" fill sizes="36px" className="object-cover" />
            </div>
          ))}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <span className="block text-base font-medium tracking-tight">Ver en vídeo</span>
        <span className="block text-xs text-background/70">
          {count === 1
            ? "1 inmueble de esta búsqueda tiene recorrido en vídeo"
            : `${count} inmuebles de esta búsqueda tienen recorrido en vídeo`}
        </span>
      </div>
      <span className="hidden flex-shrink-0 items-center gap-1.5 rounded-full bg-background px-4 py-2 text-xs font-semibold text-foreground sm:flex">
        <Play className="h-3 w-3 fill-foreground" aria-hidden />
        Reproducir
      </span>
    </Link>
  );
}
