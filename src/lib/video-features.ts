/**
 * How the site shows property videos (`website_config.features_props.video`).
 *
 * Every option defaults to the behaviour the site had before these settings
 * existed, so an account that never touches them renders exactly as before.
 * Plain module (no "use server") so client components can import the type.
 */
export type VideoFeatures = {
  /** Homepage "Recorridos en vídeo" strip of vertical video cards. */
  homeReels?: boolean;
  homeReelsTitle?: string;
  /** "" hides the subtitle; unset shows the default copy. */
  homeReelsSubtitle?: string;
  /** "▶ Vídeo" badge on listing cards that have a video. */
  cardBadge?: boolean;
  /** Desktop: the card plays its video (muted) on hover. */
  cardPreview?: boolean;
  /** Search results: banner opening Descubre with only the listings with video. */
  resultsBanner?: boolean;
  /**
   * Property page. "gallery" = the video is the first slide of the 16:9
   * gallery (original). "featured" = its own vertical column on desktop and
   * the page cover (with a Vídeo/Fotos switch) on mobile.
   */
  propertyLayout?: "gallery" | "featured";
  /** Descubre: "photos" (original) or "video-first" (video before the photos). */
  feedMedia?: "photos" | "video-first";
  /** Descubre: "classic" (original dots) or "reels" (progress bars, side rail, CTAs). */
  feedStyle?: "classic" | "reels";
  /**
   * Descubre on desktop. "classic" = as before. "adaptive" = vertical media
   * (video or portrait photo) in a centred column with the details beside it;
   * horizontal photos keep the classic full-screen view.
   */
  feedDesktop?: "classic" | "adaptive";
};

export type ResolvedVideoFeatures = Required<
  Omit<VideoFeatures, "homeReelsTitle" | "homeReelsSubtitle">
> & {
  homeReelsTitle: string;
  homeReelsSubtitle: string;
};

export const DEFAULT_HOME_REELS_TITLE = "Recorridos en vídeo";
export const DEFAULT_HOME_REELS_SUBTITLE =
  "Entra en cada casa antes de visitarla.";

/** Fill every unset/invalid option with its original behaviour. */
export function resolveVideoFeatures(
  raw: VideoFeatures | undefined,
): ResolvedVideoFeatures {
  const v = raw ?? {};
  return {
    homeReels: v.homeReels === true,
    homeReelsTitle: v.homeReelsTitle?.trim() || DEFAULT_HOME_REELS_TITLE,
    homeReelsSubtitle: v.homeReelsSubtitle ?? DEFAULT_HOME_REELS_SUBTITLE,
    cardBadge: v.cardBadge === true,
    cardPreview: v.cardPreview === true,
    resultsBanner: v.resultsBanner === true,
    propertyLayout: v.propertyLayout === "featured" ? "featured" : "gallery",
    feedMedia: v.feedMedia === "video-first" ? "video-first" : "photos",
    feedStyle: v.feedStyle === "reels" ? "reels" : "classic",
    feedDesktop: v.feedDesktop === "adaptive" ? "adaptive" : "classic",
  };
}

/** The subset the listing cards and the Descubre feed need on the client. */
export type VideoDisplay = Pick<
  ResolvedVideoFeatures,
  "cardBadge" | "cardPreview" | "feedMedia" | "feedStyle" | "feedDesktop"
>;

export const DEFAULT_VIDEO_DISPLAY: VideoDisplay = {
  cardBadge: false,
  cardPreview: false,
  feedMedia: "photos",
  feedStyle: "classic",
  feedDesktop: "classic",
};
