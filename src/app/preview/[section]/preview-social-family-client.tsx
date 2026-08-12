"use client";

import { useEffect, useState } from "react";
import { SocialFamilyView } from "~/components/social-family-view";
import type { SocialLink } from "~/components/ui/social-links";

/** The editor's shape: `{ facebook: "...", instagram: "..." }`, not an array. */
type SocialLinksRecord = Partial<Record<SocialLink["platform"], string>>;

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
 * The preview images (`previewImage`) come from the server render and are kept:
 * a patch only carries the URLs the editor holds, so re-deriving the list from
 * the patch alone would drop the thumbnails on the first keystroke.
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
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: SocialLinksRecord;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "social"
      ) {
        return;
      }
      const next = recordToLinks(data.patch);
      setLinks((prev) =>
        next.map((link) => {
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
