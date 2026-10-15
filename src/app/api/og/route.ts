import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { isAllowedImageUrl } from "~/lib/watermark";

export const runtime = "nodejs";

/**
 * The og:image every share target actually fetches: a 1200x630 JPEG built from
 * a property photo, hero image or logo.
 *
 * Why the originals cannot be linked directly:
 *
 *  1. **Size.** WhatsApp silently drops a preview image over roughly 300 KB.
 *     Full-size property photos out of S3 run 400-700 KB, so the link arrived
 *     with no thumbnail at all while the tags looked perfectly correct.
 *  2. **Shape.** We declared og:image:width/height as 1200x630 regardless of
 *     the real photo, so scrapers that trust the declaration cropped garbage.
 *
 * `fit: cover` fills the 1.91:1 card (the ratio WhatsApp, Facebook, LinkedIn
 * and Twitter all expect) and quality steps down until the body is under the
 * budget, so a busy photo degrades in quality rather than vanishing.
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
/** Comfortably under WhatsApp's ~300 KB cutoff, with room for its own re-encode. */
const MAX_BYTES = 280_000;
const QUALITY_STEPS = [82, 72, 62, 50, 40];

const CACHE_SECONDS = 60 * 60 * 24 * 30; // a listing's first photo rarely changes

/** Plain neutral card, so a share never falls back to "no image at all". */
async function placeholder(): Promise<Buffer> {
  return sharp({
    create: {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      channels: 3,
      background: { r: 233, g: 233, b: 233 },
    },
  })
    .jpeg({ quality: 70 })
    .toBuffer();
}

function respond(body: Buffer): NextResponse {
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(body.byteLength),
      "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
    },
  });
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src");
  // A logo is a wide, mostly-empty graphic: cropping it to fill the card cuts
  // the wordmark in half. Letterbox those onto white instead.
  const fit = request.nextUrl.searchParams.get("fit") === "contain" ? "contain" : "cover";

  // Never a 4xx: a scraper that gets an error status shows no card at all,
  // whereas a neutral image at least renders the title and description block.
  if (!src || !isAllowedImageUrl(src)) return respond(await placeholder());

  try {
    const upstream = await fetch(src, { next: { revalidate: CACHE_SECONDS } });
    if (!upstream.ok) return respond(await placeholder());

    const source = Buffer.from(await upstream.arrayBuffer());

    for (const quality of QUALITY_STEPS) {
      const out = await sharp(source)
        .resize(OG_WIDTH, OG_HEIGHT, {
          fit,
          position: "attention",
          background: "#ffffff",
        })
        .flatten({ background: "#ffffff" }) // transparent logos would go black
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      if (out.byteLength <= MAX_BYTES || quality === QUALITY_STEPS.at(-1)) {
        return respond(out);
      }
    }

    return respond(await placeholder());
  } catch (error) {
    console.error("[api/og] Failed to build OG image:", error);
    return respond(await placeholder());
  }
}
