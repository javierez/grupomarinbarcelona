"use client";

import { useEffect } from "react";
import { SECTION_ANCHORS } from "./preview-sections";

const ACTIVE_CLASS = "preview-active-section";

/**
 * Keeps the previewed page in sync with the section the agency is editing.
 *
 * Because every homepage section is live at once, switching sections in the
 * editor no longer needs a new iframe: the parent posts `vesta:preview-goto`
 * and we scroll + outline the target here. That removes the white reload flash
 * you got on every click of the sidebar.
 */
export function PreviewSectionSync({
  initialSection,
}: {
  initialSection: string;
}) {
  useEffect(() => {
    // Always an instant jump. Smooth scrolling looks nicer but Chrome aborts
    // the animation whenever an image finishing loading shifts the layout, and
    // on a photo-heavy homepage that means it usually never arrives.
    const focus = (section: string) => {
      document
        .querySelectorAll(`.${ACTIVE_CLASS}`)
        .forEach((el) => el.classList.remove(ACTIVE_CLASS));

      const anchor = SECTION_ANCHORS[section];
      if (!anchor) return;
      const el = document.getElementById(anchor);
      if (!el) return;

      el.classList.add(ACTIVE_CLASS);
      el.scrollIntoView({ behavior: "auto", block: "start" });
    };

    // Two frames on first paint so images and fonts have reserved their space
    // and the offset we scroll to is the final one.
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => focus(initialSection)),
    );

    const onMessage = (e: MessageEvent) => {
      const data = e.data as { type?: string; section?: string } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview-goto" ||
        typeof data.section !== "string"
      ) {
        return;
      }
      focus(data.section);
    };

    window.addEventListener("message", onMessage);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("message", onMessage);
    };
  }, [initialSection]);

  // Scoped here rather than in globals.css: it only ever applies inside the
  // editor iframe, and the public site must never ship it.
  return (
    <style>{`
      .${ACTIVE_CLASS} {
        position: relative;
        outline: 2px solid rgba(37, 99, 235, 0.45);
        outline-offset: -2px;
        border-radius: 8px;
        scroll-margin-top: 96px;
        transition: outline-color 300ms ease;
      }
      [id^="preview-"] { scroll-margin-top: 96px; }
    `}</style>
  );
}
