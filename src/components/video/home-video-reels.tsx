import { searchListings } from "~/server/queries/listings";
import { getVideoFeatures } from "~/server/queries/website-config";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { HomeVideoReelsClient } from "./home-video-reels-client";

const MAX_REELS = 12;

/**
 * Homepage "Recorridos en vídeo": the listings that have a video, as a row of
 * vertical cards. Off unless the account enabled features_props.video.homeReels,
 * and hidden when no listing has a video.
 */
export async function HomeVideoReels() {
  const video = await getVideoFeatures();
  if (!video.homeReels) return null;

  const [listings, watermarkConfig] = await Promise.all([
    searchListings({ hasVideo: true }, MAX_REELS),
    getWatermarkConfig(),
  ]);
  if (listings.length === 0) return null;

  return (
    <HomeVideoReelsClient
      listings={listings}
      title={video.homeReelsTitle}
      subtitle={video.homeReelsSubtitle}
      watermarkEnabled={watermarkConfig.enabled && !!watermarkConfig.logoUrl}
      // The section is about the videos, so the feed it opens always leads
      // with them, whatever the account chose for the general Descubre feed.
      video={{ ...video, feedMedia: "video-first" }}
    />
  );
}
