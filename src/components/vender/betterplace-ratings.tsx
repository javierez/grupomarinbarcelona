"use client";

import { useEffect, useRef } from "react";

const WIDGET_SRC =
  "https://betterplaceapp.com/public-ratings/public-ratings-widget.js";

// The vendor script looks up this exact id and inserts its iframe as the
// element's *next sibling*. It doesn't care that the element isn't a <script>,
// so an empty div works as the anchor.
const ANCHOR_ID = "public-rating-widget";

declare global {
  interface Window {
    initPublicRatingsWidget?: (params: {
      width?: string | number;
      height?: string | number;
      url: string;
    }) => void;
  }
}

interface BetterPlaceRatingsProps {
  /** BetterPlace public-ratings URL (must include `iframe=true`). */
  url: string;
  height?: number;
}

export function BetterPlaceRatings({
  url,
  height = 500,
}: BetterPlaceRatingsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;

      const viewportsBefore = new Set(
        document.querySelectorAll('meta[name="viewport"]'),
      );

      window.initPublicRatingsWidget?.({ width: "100%", height, url });

      // The vendor script appends its own viewport meta carrying
      // `maximum-scale=1, user-scalable=0`. Being last in <head> it wins over
      // ours and kills pinch-zoom for the whole site, so drop it again.
      document.querySelectorAll('meta[name="viewport"]').forEach((meta) => {
        if (!viewportsBefore.has(meta)) meta.remove();
      });
    };

    // Raw <script> tags in JSX never execute, so the loader is injected by hand.
    // Reuse the tag if another mount already added it.
    if (window.initPublicRatingsWidget) {
      init();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${WIDGET_SRC}"]`,
      );
      const script = existing ?? document.createElement("script");
      script.addEventListener("load", init);
      if (!existing) {
        script.src = WIDGET_SRC;
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      // The iframe lands inside this container (right after the anchor), so a
      // remount — StrictMode, or navigating away and back — would stack copies.
      container?.querySelectorAll("iframe").forEach((frame) => frame.remove());
    };
  }, [url, height]);

  return (
    <div ref={containerRef}>
      <div id={ANCHOR_ID} />
    </div>
  );
}
