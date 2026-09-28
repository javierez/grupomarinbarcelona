"use client";

import { useEffect, useState } from "react";
import { BannerCarousel } from "~/components/banner-carousel";
import type { BannerProps } from "~/lib/data";
import type { ResolvedBanner } from "~/server/queries/banner";
import { announceReady, readPreviewMessage, slice } from "./preview-patch";

/** Slice names the editor sends. Order matters: the first is the bare shape. */
const KEYS = ["bannerProps"] as const;

/**
 * Presentation fields shared by every banner kind — the ones the editor can
 * change without any lookup, so they resolve here rather than on the server.
 */
function chrome(props: BannerProps) {
  const p = props as Extract<BannerProps, { kind: "custom" }>;
  return {
    overlay: p.overlay ?? true,
    align: p.align ?? "left",
    fit: p.fit ?? "cover",
    bare: p.bare ?? false,
  } as const;
}

/**
 * Re-resolve the slides for a patched config.
 *
 * `custom` is resolved outright: everything it shows is in the patch. The kinds
 * that point at something — una promoción, un inmueble — keep the slides the
 * server resolved and take the overrides on top, because the title, subtitle
 * and image of the referenced entity came from a query this side cannot run.
 *
 * The one thing that still waits for a reload is therefore narrow and worth
 * naming: picking a DIFFERENT promoción or inmueble. Its own copy keeps showing
 * until the frame reloads. Everything else — kind, textos, imagen de fondo,
 * overlay, alineación, encaje, CTA, intervalo — is live.
 */
function resolveSlides(
  props: BannerProps,
  serverSlides: ResolvedBanner[],
): ResolvedBanner[] {
  if (props.kind === "none") return [];

  const base = chrome(props);

  if (props.kind === "custom") {
    if (!props.title && !props.backgroundImage) return [];
    return [
      {
        title: props.title ?? "",
        subtitle: props.subtitle,
        backgroundImage: props.backgroundImage,
        ctaLabel: props.ctaLabel,
        ctaHref: props.ctaHref,
        ...base,
      },
    ];
  }

  // Nothing resolved server-side to build on: the account only just switched to
  // this kind, so the entity has never been fetched. Say nothing rather than
  // invent a slide.
  if (serverSlides.length === 0) return [];

  const eyebrow = props.kind === "promotions" ? props.eyebrow : undefined;

  return serverSlides.map((slide) => ({
    ...slide,
    ...base,
    eyebrow: eyebrow ?? slide.eyebrow,
    title: ("title" in props ? props.title : undefined) ?? slide.title,
    subtitle:
      ("subtitle" in props ? props.subtitle : undefined) ?? slide.subtitle,
    backgroundImage:
      ("backgroundImage" in props ? props.backgroundImage : undefined) ??
      slide.backgroundImage,
    ctaLabel: props.ctaLabel ?? slide.ctaLabel,
  }));
}

/**
 * The big homepage banner, following the editor live.
 *
 * It used to be a plain server component, so every change to it — switching it
 * on at all, the image, the copy, the alignment — needed a reload of the frame.
 */
export function PreviewBannerClient({
  initialSlides,
  initialIntervalMs,
}: {
  initialSlides: ResolvedBanner[];
  initialIntervalMs: number;
}) {
  const [slides, setSlides] = useState<ResolvedBanner[]>(initialSlides);
  const [intervalMs, setIntervalMs] = useState(initialIntervalMs);

  useEffect(() => {
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e.data, "banner");
      if (!msg) return;
      const next = slice<BannerProps>(msg.patch, "bannerProps", KEYS);
      if (!next?.kind) return;
      setSlides(resolveSlides(next, initialSlides));
      if (next.kind === "promotions" && next.intervalMs) {
        setIntervalMs(next.intervalMs);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [initialSlides]);

  if (slides.length === 0) return null;
  return <BannerCarousel slides={slides} intervalMs={intervalMs} />;
}
