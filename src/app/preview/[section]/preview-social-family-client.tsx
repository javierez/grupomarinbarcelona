"use client";

import { useEffect, useState } from "react";
import { SocialFamilyView } from "~/components/social-family-view";
import type { SocialLink } from "~/components/ui/social-links";
import { announceReady, readPreviewMessage, slice } from "./preview-patch";

/** The editor's shape: `{ facebook: "...", instagram: "..." }`, not an array. */
type SocialLinksRecord = Partial<Record<SocialLink["platform"], string>>;

/** Slice names the editor sends. Order matters: the first is the bare shape. */
const KEYS = ["socialLinks", "socialImages"] as const;

const SUPPORTED: SocialLink["platform"][] = [
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "facebook",
  "twitter",
];

function recordToLinks(rec: SocialLinksRecord | undefined): SocialLink[] {
  if (!rec) return [];
  return Object.entries(rec)
    .filter(([, url]) => typeof url === "string" && url.trim().length > 0)
    .filter(([k]) =>
      SUPPORTED.includes(k.toLowerCase() as SocialLink["platform"]),
    )
    .map(([platform, url]) => ({
      platform: platform.toLowerCase() as SocialLink["platform"],
      url: String(url).trim(),
    }));
}

/**
 * The "Sé uno más de la familia" cards, following the editor live.
 *
 * Renders `SocialFamilyView` rather than a simplified row of icons: the whole
 * point of the preview is that what the agency sees is what ships, and a
 * stand-in would quietly disagree with the real homepage.
 *
 * The card photos travel in the patch as their own `socialImages` slice, so
 * adding one shows up straight away. An older editor sends the URLs bare and
 * nothing else; then — and only then — the photos from the server render are
 * carried forward, because dropping them on the first keystroke was the old
 * behaviour and it read as "the preview lost my pictures".
 */
export function PreviewSocialFamilyClient({
  initialLinks,
  subtitle,
  platforms,
  minimal,
}: {
  initialLinks: SocialLink[];
  subtitle?: string;
  platforms?: SocialLink["platform"][];
  minimal: boolean;
}) {
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);

  useEffect(() => {
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e.data, "social");
      if (!msg) return;

      const urls = slice<SocialLinksRecord>(msg.patch, "socialLinks", KEYS);
      const images = slice<SocialLinksRecord>(msg.patch, "socialImages", KEYS);
      const next = recordToLinks(urls);

      setLinks((prev) =>
        next.map((link) => {
          const photo = images?.[link.platform]?.trim();
          if (photo) return { ...link, previewImage: photo };
          // An editor that sent no photos at all knows nothing about them —
          // keep what the server rendered. One that sent them and left this
          // platform empty means it genuinely has no photo.
          if (images) return link;
          const before = prev.find((p) => p.platform === link.platform);
          return before?.previewImage
            ? { ...link, previewImage: before.previewImage }
            : link;
        }),
      );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <SocialFamilyView
      links={links}
      subtitle={subtitle}
      platforms={platforms}
      minimal={minimal}
    />
  );
}
