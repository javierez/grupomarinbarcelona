import {
  ACCOUNT_141_OPENAI_PIXEL_ID,
  isAccount141,
} from "~/lib/account-overrides/141";
import { ACCOUNT_141_LANDING_HTML } from "~/lib/account-overrides/141-landing";

// Adónde manda el formulario los leads: a Vesta, con procedencia
// «Goex-Chatgpt» (src/app/api/anuncios/lead/route.ts).
const FORM_ENDPOINT = "/api/anuncios/lead";

// La landing de anuncios es solo de Grupo Marín: en el resto de agencias, 404.
export const dynamic = "force-static";

export function GET(): Response {
  if (!isAccount141()) return new Response("Not found", { status: 404 });
  const html = ACCOUNT_141_LANDING_HTML.replace(
    "__OPENAI_PIXEL_ID__",
    ACCOUNT_141_OPENAI_PIXEL_ID,
  ).replace("__FORM_ENDPOINT__", FORM_ENDPOINT);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
