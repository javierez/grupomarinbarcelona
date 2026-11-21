"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BORRADOR_PARAM } from "~/lib/firma-web";
import { MENSAJE_LISTO } from "~/lib/seleccion";
import { esPadrePermitido } from "~/lib/vesta-origins";
import { MENU_EN_VIVO, enlacesDelMenu, ordenDelMenu, type MenuEnVivo } from "~/lib/nav-extra";
import {
  THEME_VARS,
  siteTheme,
  type ThemeColors,
  type ThemeFonts,
} from "~/lib/theme-style";

type Patch = {
  colorProps?: ThemeColors;
  fontProps?: ThemeFonts;
  featuresProps?: { siteStyle?: string | null; navExtra?: unknown; navOrder?: unknown };
};

function applyTheme(colors: ThemeColors, fonts: ThemeFonts) {
  const { vars, googleFontsHref } = siteTheme(colors, fonts, undefined, { googleFonts: true });
  for (const name of THEME_VARS) {
    const value = vars[name];
    if (value) document.body.style.setProperty(name, value);
    else document.body.style.removeProperty(name);
  }
  if (googleFontsHref && !document.querySelector(`link[href="${CSS.escape(googleFontsHref)}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = googleFontsHref;
    document.head.appendChild(link);
  }
}

/**
 * Solo con un enlace de borrador válido (contrato web-por-chat §3 y §6).
 *
 * - El enlace firmado se queda en la URL al navegar dentro del iframe: el
 *   middleware lo lee de la URL o de la página de la que se viene, así el
 *   borrador sigue aunque el navegador bloquee la cookie (Safari en iframe).
 * - Escucha `vesta:preview` del CRM y aplica al momento colores, fuentes, el
 *   estilo editorial y el menú (enlaces propios y orden). Lo demás se ve al
 *   recargar: el borrador ya está en la base.
 */
export function BorradorEnVivo({
  token,
  colors,
  fonts,
}: {
  token: string;
  colors: ThemeColors | null;
  fonts: ThemeFonts | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useRef({ colors: colors ?? {}, fonts: fonts ?? {} });

  useEffect(() => {
    if (searchParams.get(BORRADOR_PARAM) === token) return;
    const url = new URL(window.location.href);
    url.searchParams.set(BORRADOR_PARAM, token);
    window.history.replaceState(null, "", url);
  }, [pathname, searchParams, token]);

  useEffect(() => {
    if (window.parent === window) return;
    window.parent.postMessage(MENSAJE_LISTO, "*");

    const onMessage = (e: MessageEvent) => {
      if (e.source !== window.parent) return;
      if (!esPadrePermitido(e.origin, window.location.origin)) return;
      const data = e.data as { type?: unknown; patch?: unknown } | null;
      if (data?.type !== "vesta:preview" || typeof data.patch !== "object" || !data.patch) return;
      const { colorProps, fontProps, featuresProps } = data.patch as Patch;

      if (colorProps ?? fontProps) {
        theme.current = {
          colors: { ...theme.current.colors, ...colorProps },
          fonts: { ...theme.current.fonts, ...fontProps },
        };
        applyTheme(theme.current.colors, theme.current.fonts);
      }
      if (featuresProps && "siteStyle" in featuresProps) {
        document.body.classList.toggle("style-editorial", featuresProps.siteStyle === "editorial");
      }
      if (featuresProps) {
        // Llega la sección entera (contrato §7): sin navExtra, ya no hay enlaces.
        const menu: MenuEnVivo = {
          navExtra: enlacesDelMenu(featuresProps.navExtra),
          navOrder: ordenDelMenu(featuresProps.navOrder),
        };
        window.dispatchEvent(new CustomEvent(MENU_EN_VIVO, { detail: menu }));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return null;
}
