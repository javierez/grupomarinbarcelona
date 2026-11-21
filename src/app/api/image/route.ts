import { NextResponse, type NextRequest } from "next/server";
import { isAllowedImageUrl, applyWatermark } from "~/lib/watermark";
import { getWatermarkConfig } from "~/server/queries/watermark";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    const debug = request.nextUrl.searchParams.get("debug");

    // Debug mode: return JSON diagnostic info
    if (debug === "1") {
      const config = await getWatermarkConfig();
      const allowed = url ? isAllowedImageUrl(url) : false;
      let hostname = "";
      try { if (url) hostname = new URL(url).hostname; } catch { hostname = "INVALID"; }
      return NextResponse.json({ url, hostname, allowed, watermarkConfig: config });
    }

    if (!url) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    const allowed = isAllowedImageUrl(url);

    if (!allowed) {
      return new NextResponse(`URL not allowed: ${url}`, { status: 403 });
    }

    const cacheHeaders = {
      "Cache-Control": "public, s-maxage=604800, max-age=86400, stale-while-revalidate=86400",
    };

    let imageBuffer: Buffer;
    let contentType: string;

    try {
      const imageResponse = await fetch(url);
      if (!imageResponse.ok) {
        return new NextResponse("Failed to fetch image", { status: 502 });
      }
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
    } catch (fetchErr) {
      console.error("[api/image] Fetch error:", fetchErr);
      return new NextResponse("Failed to fetch image", { status: 502 });
    }

    const config = await getWatermarkConfig();

    if (!config.enabled || !config.logoUrl) {
      return new NextResponse(imageBuffer, {
        headers: { "Content-Type": contentType, ...cacheHeaders },
      });
    }

    try {
      const watermarkedBuffer = await applyWatermark(imageBuffer, config);
      return new NextResponse(watermarkedBuffer, {
        headers: { "Content-Type": "image/jpeg", ...cacheHeaders },
      });
    } catch (error) {
      console.error("[api/image] Watermark error:", error);
      return new NextResponse(imageBuffer, {
        headers: { "Content-Type": contentType, ...cacheHeaders },
      });
    }
  } catch (topError) {
    console.error("[api/image] TOP-LEVEL ERROR:", topError);
    return new NextResponse(
      JSON.stringify({ error: String(topError) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
