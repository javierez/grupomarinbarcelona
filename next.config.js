/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */

// Node 22+ exposes a broken `localStorage` global that crashes SSR code.
// Remove it so libraries use their normal browser-detection guards.
// @ts-ignore — globalThis.localStorage is not optional but we need to remove it
if ("localStorage" in globalThis)
  delete (/** @type {any} */ (globalThis).localStorage);

import "./src/env.js";
import { VESTA_FRAME_ANCESTORS } from "./src/lib/vesta-origins.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "acropolis-realestate.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        // Convex file storage (property images served from Convex, not S3)
        protocol: "https",
        hostname: "*.convex.cloud",
        port: "",
        pathname: "/**",
      },
    ],
    // Optimize images
    unoptimized: true,
    // Configure image sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Use modern formats
    formats: ["image/webp"],
    // Set minimum cache TTL
    minimumCacheTTL: 60,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Increase from 1MB to 10MB for large property data
    },
  },
  async redirects() {
    // News URLs from agencies' previous websites (go4asturias.com still had
    // /noticia/19963 and /noticias?page=2 indexed). They used to fall into the
    // [...slug] search route; send them, and their link equity, to the blog.
    return [
      { source: "/noticias", destination: "/blog", permanent: true },
      { source: "/noticia/:path*", destination: "/blog", permanent: true },
    ];
  },
  async headers() {
    // Who may iframe the site: the CRM shows the real site, with its draft,
    // inside the editor (contrato web-por-chat §5). PREVIEW_ALLOWED_ANCESTORS
    // adds hosts on a given deployment (e.g. a CRM preview URL).
    const frameAncestors = [
      VESTA_FRAME_ANCESTORS,
      process.env.PREVIEW_ALLOWED_ANCESTORS,
    ]
      .filter(Boolean)
      .join(" ");

    const baseCspParts = [
      "default-src 'self'",
      // betterplaceapp.com: the BetterPlace valuation widget loader (account 155
      // /vender). It only injects an iframe; the iframe itself is covered by
      // `frame-src` below.
      // googletagmanager: the GA4 tag (<GoogleAnalytics> in app/layout). Without
      // it the tag renders and the browser refuses to fetch it, so analytics
      // stays silently dead — which is exactly how it was for every account
      // that had configured a measurement id.
      // cdn.gtranslate.net: the ES/EN translator (features_props.languageSwitcher).
      // connect.facebook.net: el píxel de Meta (head_props.facebookPixel), que
      // manda sus visitas a www.facebook.com (img-src y connect-src).
      // bzrcdn.openai.com: el píxel de OpenAI (anuncios de ChatGPT, landing
      // /anuncios de la 141), que baja su configuración de bzrcdn.openai.com y
      // manda sus eventos a bzr.openai.com (los dos en connect-src). Sin esto el navegador lo bloquea y OpenAI no ve ni
      // visitas ni leads (8-nov-2026).
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://betterplaceapp.com https://www.googletagmanager.com https://cdn.gtranslate.net https://connect.facebook.net https://bzrcdn.openai.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.google-analytics.com https://www.googletagmanager.com https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://*.s3.eu-west-1.amazonaws.com https://*.convex.cloud https://images.unsplash.com https://maps.googleapis.com https://maps.gstatic.com https://i.ytimg.com https://www.facebook.com",
      "font-src 'self' https://fonts.gstatic.com",
      "media-src 'self' https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://*.s3.eu-west-1.amazonaws.com",
      // GA sends its hits to google-analytics.com (and analytics.google.com for
      // some regions); the script loading is not enough on its own.
      "connect-src 'self' https://maps.googleapis.com https://*.s3.amazonaws.com https://*.s3.us-east-1.amazonaws.com https://*.s3.eu-west-1.amazonaws.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://translate-pa.googleapis.com https://www.facebook.com https://connect.facebook.net https://bzr.openai.com https://bzrcdn.openai.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    // Allow all https iframes: YouTube videos plus virtual tours from
    // arbitrary providers (Matterport, Kuula, etc. — tour.url is
    // CRM-supplied). `frame-src` is what WE embed; who embeds US is locked
    // by frame-ancestors below.
    const frameSrc = "frame-src 'self' https:";

    const sharedHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    // Every page, /preview included. No X-Frame-Options: it is all-or-nothing
    // and would block the editor; frame-ancestors limits embedding to the CRM.
    return [
      {
        source: "/:path*",
        headers: [
          ...sharedHeaders,
          {
            key: "Content-Security-Policy",
            value: [
              ...baseCspParts,
              frameSrc,
              `frame-ancestors ${frameAncestors}`,
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default config;
