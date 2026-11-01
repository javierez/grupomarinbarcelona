"use client";

import { useEffect } from "react";

/**
 * Bring the section being edited into view once the page has painted.
 *
 * The preview renders the whole homepage, so without this the editor would
 * always open at the hero no matter which section the agency clicked. Runs on
 * mount only — after that the user is free to scroll the page themselves.
 */
export function PreviewScrollTo({ anchor }: { anchor?: string }) {
  useEffect(() => {
    if (!anchor || anchor === "preview-hero") return;
    // Two frames: the first lets layout settle, the second runs after images
    // and fonts have reserved their space, so the offset is the real one.
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(anchor)
          ?.scrollIntoView({ behavior: "auto", block: "start" });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [anchor]);

  return null;
}
