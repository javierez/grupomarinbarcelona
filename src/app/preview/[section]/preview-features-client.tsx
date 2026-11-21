"use client";

import { useEffect, useState } from "react";
import type { SocialLink } from "~/components/ui/social-links";
import type { FeaturesProps } from "~/server/queries/website-config";
import { PreviewSocialFamilyClient } from "./preview-social-family-client";
import {
  announceReady,
  isKeyedPatch,
  readPreviewMessage,
} from "./preview-patch";

/**
 * `features_props` for the previewed account, kept live.
 *
 * These flags decide which sections the homepage has at all, and they were
 * resolved on the server — so switching one in the Funcionalidades tab changed
 * nothing until the agency reloaded the frame. Two tabs can move them, and both
 * are honoured here: Funcionalidades sends `featuresProps` bare, and Portada
 * sends it alongside the hero (half of what that tab edits lives in these
 * flags).
 */
function readFeaturesPatch(data: unknown): FeaturesProps | undefined {
  for (const section of ["funcionalidades", "hero"] as const) {
    const msg = readPreviewMessage(data, section);
    if (!msg) continue;
    if (isKeyedPatch(msg.patch, ["heroProps", "featuresProps"])) {
      return msg.patch.featuresProps as FeaturesProps | undefined;
    }
    // Funcionalidades watches one path, so its patch is the value itself.
    if (section === "funcionalidades") {
      return msg.patch as FeaturesProps | undefined;
    }
  }
  return undefined;
}

function useLiveFeatures(initial: FeaturesProps): FeaturesProps {
  const [features, setFeatures] = useState<FeaturesProps>(initial);

  useEffect(() => {
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const next = readFeaturesPatch(e.data);
      if (next) setFeatures(next);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return features;
}

/**
 * The "Sé uno más de la familia" block, at one of its two possible positions.
 *
 * Rendered at BOTH sites on the homepage; each copy decides whether it is the
 * one that should appear. That keeps the flag's "top or bottom" switch live
 * without lifting the whole page layout into a client component — moving it is
 * then just the two copies swapping which of them returns null.
 */
export function PreviewSocialFamilySlot({
  position,
  initialFeatures,
  initialLinks,
  fallbackEnabled,
}: {
  position: "top" | "bottom";
  initialFeatures: FeaturesProps;
  initialLinks: SocialLink[];
  /** `about_props.showSocialFamilySection` — the pre-flags way of enabling it. */
  fallbackEnabled: boolean;
}) {
  const features = useLiveFeatures(initialFeatures);

  const enabled = features.sections?.socialFamily ?? fallbackEnabled;
  const atBottom = features.sections?.socialFamilyPosition === "bottom";
  if (!enabled) return null;
  if (atBottom !== (position === "bottom")) return null;

  return (
    <div id="preview-social">
      {/* Its subtitle and which networks show are flags too, so they come from
          the live copy rather than the server-resolved one. */}
      <PreviewSocialFamilyClient
        initialLinks={initialLinks}
        subtitle={features.sections?.socialFamilySubtitle}
        platforms={features.sections?.socialFamilyPlatforms}
        minimal={features.headerStyle === "minimal"}
      />
    </div>
  );
}
