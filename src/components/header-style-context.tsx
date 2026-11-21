"use client";

import { createContext, useContext } from "react";
import type { DescriptionAlign } from "~/lib/description-align";

export type { DescriptionAlign };
export { descriptionAlignClass } from "~/lib/description-align";

/**
 * Site-wide presentation flags sourced from website_config.features_props.
 * - `minimalHeaders`: hide the kicker above + subtitle below section titles.
 * - `descriptionAlign`: override the text alignment of description/paragraph
 *   blocks ("justify"/"center"); undefined keeps each block's existing align.
 *
 * Client components read these via the hooks below; server components read
 * `getFeaturesProps()` directly and use `descriptionAlignClass()`.
 */
type WebsiteStyle = {
  minimalHeaders: boolean;
  descriptionAlign: DescriptionAlign;
  /** `features_props.aspectoV1`: the v1 look (docs/v1-a-v2.md §3). */
  aspectoV1: boolean;
  /** `features_props.v1Inicial`: la v1 de El Mito (142). */
  v1Inicial?: boolean;
  /**
   * La cuenta que se pinta. En la vista previa del CRM no es la del despliegue
   * (`NEXT_PUBLIC_ACCOUNT_ID`): un `isAccount139()` a secas en un componente
   * de cliente pintaba la 139 con las reglas de otra (17-nov-2026).
   */
  cuenta?: string;
};

const WebsiteStyleContext = createContext<WebsiteStyle>({
  minimalHeaders: false,
  descriptionAlign: undefined,
  aspectoV1: false,
});

export function HeaderStyleProvider({
  minimal,
  descriptionAlign,
  aspectoV1 = false,
  v1Inicial = false,
  cuenta,
  children,
}: {
  minimal: boolean;
  descriptionAlign?: DescriptionAlign;
  aspectoV1?: boolean;
  v1Inicial?: boolean;
  cuenta?: string;
  children: React.ReactNode;
}) {
  return (
    <WebsiteStyleContext.Provider
      value={{ minimalHeaders: minimal, descriptionAlign, aspectoV1, v1Inicial, cuenta }}
    >
      {children}
    </WebsiteStyleContext.Provider>
  );
}

export function useMinimalHeaders(): boolean {
  return useContext(WebsiteStyleContext).minimalHeaders;
}

export function useDescriptionAlign(): DescriptionAlign {
  return useContext(WebsiteStyleContext).descriptionAlign;
}

export function useAspectoV1(): boolean {
  return useContext(WebsiteStyleContext).aspectoV1;
}

/** La v1 de El Mito (142), anterior a la de 21. */
export function useV1Inicial(): boolean {
  return useContext(WebsiteStyleContext).v1Inicial === true;
}

/** La cuenta que se pinta, para los `isAccountNNN(cuenta)` de cliente. */
export function useCuenta(): string | undefined {
  return useContext(WebsiteStyleContext).cuenta;
}
