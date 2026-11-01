/**
 * The site's own public origin, e.g. "https://go4asturias.com".
 *
 * Every generated site is a separate Vercel project with its own domain, and
 * `NEXT_PUBLIC_SITE_URL` was never wired into the generator — so it is unset on
 * production deployments and every absolute URL we emit (canonicals, sitemap,
 * robots, og:url, and crucially the og:image that WhatsApp/Facebook fetch)
 * pointed at `https://example.com`. Broken image URL = no link thumbnail.
 *
 * Vercel injects `VERCEL_PROJECT_PRODUCTION_URL` (the project's production
 * domain, custom domain included) into every build with no configuration, so
 * use it as the fallback. An explicit `NEXT_PUBLIC_SITE_URL` still wins for
 * accounts whose canonical host differs from the Vercel production domain.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}
