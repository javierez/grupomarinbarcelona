import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { FIRMA_HEADER, revalidacionValida } from "~/lib/firma-web";
import { siteConfigTag } from "~/lib/site-config-columns";
// El generador escribe aquí el commit de vestawebpage-v2 con el que montó
// esta web; en el repo de la plantilla vale null.
import plantilla from "~/lib/plantilla-version.json";

export const dynamic = "force-dynamic";

const SIN_CACHE = { "Cache-Control": "no-store" };

/**
 * Contrato web-por-chat §4. Sin llave: qué plantilla y qué versión sirve esta
 * web, y si puede enseñar borradores (tiene VESTA_CLAVE_WEB).
 */
export function GET() {
  return NextResponse.json(
    {
      ok: true,
      plantilla: "v2",
      sha: plantilla.sha ?? env.VERCEL_GIT_COMMIT_SHA ?? null,
      borrador: Boolean(env.VESTA_CLAVE_WEB),
    },
    { headers: SIN_CACHE },
  );
}

/**
 * Al publicar, el CRM firma `{ accountId, exp }` con la clave de esta web.
 * Se invalida la configuración en caché y la siguiente visita ya la ve.
 */
export async function POST(request: Request) {
  const cuerpo: unknown = await request.json().catch(() => null);
  const valida = await revalidacionValida(cuerpo, request.headers.get(FIRMA_HEADER), {
    clave: env.VESTA_CLAVE_WEB,
    accountId: env.NEXT_PUBLIC_ACCOUNT_ID,
  });
  if (!valida) {
    return NextResponse.json({ ok: false }, { status: 401, headers: SIN_CACHE });
  }
  revalidateTag(siteConfigTag(env.NEXT_PUBLIC_ACCOUNT_ID));
  return NextResponse.json({ ok: true }, { headers: SIN_CACHE });
}
