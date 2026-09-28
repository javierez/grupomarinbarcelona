"use client";

import { useEffect, useState } from "react";
import { SocialLinks, type SocialLink } from "~/components/ui/social-links";
import { announceReady, readPreviewMessage, slice } from "./preview-patch";

// The form's socialLinks shape is a record like { facebook: "...", twitter: "..." }
type SocialLinksRecord = Partial<Record<SocialLink["platform"], string>>;

/** Slice names the editor sends. Order matters: the first is the bare shape. */
const KEYS = ["socialLinks", "socialImages"] as const;

const SUPPORTED: SocialLink["platform"][] = [
  "facebook",
  "twitter",
  "instagram",
  "linkedin",
  "youtube",
];

function recordToArray(rec: SocialLinksRecord | undefined): SocialLink[] {
  if (!rec) return [];
  return Object.entries(rec)
    .filter(([_, url]) => typeof url === "string" && url.trim().length > 0)
    .filter(([k]) =>
      SUPPORTED.includes(k.toLowerCase() as SocialLink["platform"]),
    )
    .map(([platform, url]) => ({
      platform: platform.toLowerCase() as SocialLink["platform"],
      url: String(url).trim(),
    }));
}

export function PreviewSocialClient({
  initialLinks,
}: {
  initialLinks: SocialLink[];
}) {
  const [links, setLinks] = useState<SocialLink[]>(initialLinks);

  useEffect(() => {
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e.data, "social");
      if (!msg) return;
      // An even older editor posted the array straight through.
      if (Array.isArray(msg.patch)) {
        setLinks(msg.patch as SocialLink[]);
        return;
      }
      const urls = slice<SocialLinksRecord>(msg.patch, "socialLinks", KEYS);
      if (urls) setLinks(recordToArray(urls));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-16">
      <p className="text-sm text-muted-foreground">
        Iconos sociales — aparecen en la cabecera y el pie del sitio
      </p>
      <SocialLinks links={links} className="text-foreground" />
      {links.length === 0 && (
        <p className="text-xs text-muted-foreground">
          (No hay redes configuradas)
        </p>
      )}
    </div>
  );
}
