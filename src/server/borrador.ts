import { cache } from "react";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { env } from "~/env";
import { BORRADOR_HEADER, borradorValido } from "~/lib/firma-web";

/**
 * El enlace de borrador de esta petición, ya comprobado, o null si enseña lo
 * publicado (docs/plan/web-por-chat-contrato.md §3).
 *
 * El middleware lo pone en `x-vesta-borrador` tras comprobar la firma y borra
 * el que llegue de fuera. Aquí se vuelve a comprobar porque sitemap.xml y
 * robots.txt no pasan por el middleware: sin esto, cualquiera mandaría la
 * cabecera a mano.
 */
export const borradorDeLaPeticion = cache(async (): Promise<string | null> => {
  let token: string | null;
  try {
    token = (await headers()).get(BORRADOR_HEADER);
  } catch (error) {
    // Fuera de una petición (build, una ruta estática) no hay borrador.
    unstable_rethrow(error);
    return null;
  }
  const valido = await borradorValido(token, {
    clave: env.VESTA_CLAVE_WEB,
    accountId: env.NEXT_PUBLIC_ACCOUNT_ID,
  });
  return valido ? token : null;
});
