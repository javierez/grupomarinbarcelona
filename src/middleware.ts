import { NextResponse, type NextRequest } from "next/server";
import { vueltaALaPrevia } from "~/lib/preview-salida";
import { env } from "~/env";
import {
  BORRADOR_COOKIE,
  BORRADOR_HEADER,
  BORRADOR_PARAM,
  borradorValido,
  segundosDeBorrador,
} from "~/lib/firma-web";

const COOKIE_ATTRS = "Path=/; HttpOnly; Secure; SameSite=None; Partitioned";

/**
 * El enlace de borrador de la petición (contrato web-por-chat §3), de la URL,
 * de la cookie o de la página de la que se viene (mismo origen). Lo último
 * cubre los navegadores que bloquean la cookie dentro del iframe del CRM:
 * `BorradorEnVivo` mantiene el enlace en la URL al navegar.
 */
function candidatos(request: NextRequest): string[] {
  const out: string[] = [];
  const deLaUrl = request.nextUrl.searchParams.get(BORRADOR_PARAM);
  if (deLaUrl) out.push(deLaUrl);
  const deLaCookie = request.cookies.get(BORRADOR_COOKIE)?.value;
  if (deLaCookie) out.push(deLaCookie);
  const referer = request.headers.get("referer");
  if (referer?.includes(`${BORRADOR_PARAM}=`)) {
    try {
      const origen = new URL(referer);
      const token = origen.searchParams.get(BORRADOR_PARAM);
      if (origen.origin === request.nextUrl.origin && token) out.push(token);
    } catch {
      // Referer roto: como si no hubiera.
    }
  }
  return out;
}

async function borradorDe(request: NextRequest): Promise<string | null> {
  // Las rutas de /api (imágenes con marca de agua, leads) se cachean en la CDN:
  // siempre lo publicado.
  if (request.nextUrl.pathname.startsWith("/api/")) return null;
  for (const token of candidatos(request)) {
    const valido = await borradorValido(token, {
      clave: env.VESTA_CLAVE_WEB,
      accountId: env.NEXT_PUBLIC_ACCOUNT_ID,
    });
    if (valido) return token;
  }
  return null;
}

/**
 * Sets `x-pathname` so server layouts can branch on the current path
 * (e.g. skip Navbar/WhatsAppButton on `/preview/*`), and `x-vesta-borrador`
 * when the request carries a valid draft link.
 */
export async function middleware(request: NextRequest) {
  const vuelta = vueltaALaPrevia({
    url: request.url,
    referer: request.headers.get("referer"),
    destino: request.headers.get("sec-fetch-dest"),
    esRsc: request.headers.has("rsc"),
  });
  if (vuelta) return NextResponse.redirect(vuelta);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  // Layouts can't read searchParams, but the preview layout needs the signed
  // accountId to render the right agency's navbar/logo/colours. Forward the
  // raw query string; the layout verifies the token before trusting it.
  if (request.nextUrl.pathname.startsWith("/preview")) {
    requestHeaders.set("x-preview-qs", request.nextUrl.search);
  }

  // Solo este middleware dice que una petición es de borrador.
  requestHeaders.delete(BORRADOR_HEADER);
  const borrador = await borradorDe(request);
  if (borrador) requestHeaders.set(BORRADOR_HEADER, borrador);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const cookie = request.cookies.get(BORRADOR_COOKIE)?.value;

  if (borrador) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    if (cookie !== borrador) {
      response.headers.append(
        "Set-Cookie",
        `${BORRADOR_COOKIE}=${borrador}; Max-Age=${segundosDeBorrador(borrador)}; ${COOKIE_ATTRS}`,
      );
    }
  } else if (cookie && !request.nextUrl.pathname.startsWith("/api/")) {
    // Caducado o de otra clave: fuera, y la web vuelve a lo publicado.
    response.headers.append("Set-Cookie", `${BORRADOR_COOKIE}=; Max-Age=0; ${COOKIE_ATTRS}`);
  }
  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static assets / Next internals.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
