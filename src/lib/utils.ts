import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(numPrice);
}

export function formatPriceOrConsult(
  price: string | number | null | undefined,
  isRental = false,
): string {
  const num =
    typeof price === "string" ? parseFloat(price) : (price ?? 0);
  if (!num || isNaN(num)) return "A consultar";
  return `${formatPrice(num)}€${isRental ? "/mes" : ""}`;
}

// Statuses that mean the listing is closed (sold or rented). Covers both the
// DB vocabulary ("Vendido" / "Alquilado" / "Sold") and the legacy `Property`
// type ("sold" / "rented").
const CLOSED_STATUSES = new Set([
  "sold",
  "rented",
  "Sold",
  "Vendido",
  "Alquilado",
]);

export function isClosedStatus(status?: string | null): boolean {
  return status != null && CLOSED_STATUSES.has(status);
}

export type PriceDisplay =
  | { mode: "value"; text: string }
  | { mode: "consult"; text: string }
  | { mode: "hidden" };

/**
 * Decide how a listing's price should render, driven by `fc_price_visibility`
 * (`hidePrice`) and the listing status:
 * - Price shown (hidePrice false): always show the real price.
 * - Price hidden + still published: show "A consultar".
 * - Price hidden + sold/rented: hide the price entirely (no blur, no text).
 */
export function resolvePriceDisplay(opts: {
  price: string | number | null | undefined;
  hidePrice?: boolean | null;
  status?: string | null;
  isRental?: boolean;
}): PriceDisplay {
  const { price, hidePrice, status, isRental = false } = opts;
  if (!hidePrice) {
    return { mode: "value", text: formatPriceOrConsult(price, isRental) };
  }
  if (isClosedStatus(status)) {
    return { mode: "hidden" };
  }
  return { mode: "consult", text: "A consultar" };
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-ES", { useGrouping: true }).format(num);
}

export function hexToRgba(hex: string, opacity: number): string | null {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return null;
  const r = parseInt(sanitized.substring(0, 2), 16);
  const g = parseInt(sanitized.substring(2, 4), 16);
  const b = parseInt(sanitized.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function hexToHsl(hex: string): string | null {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return null;
  const r = parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = parseInt(sanitized.substring(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      case b: h = ((r - g) / d + 4); break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Darken a hex colour as if a black layer of `ratio` opacity were laid over it
 * (0 = unchanged, 1 = black). Returns a `#rrggbb` string, or the input if it
 * can't be parsed.
 */
export function mixWithBlack(hex: string, ratio: number): string {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return hex;
  const k = Math.min(1, Math.max(0, ratio));
  const channel = (start: number) => {
    const v = parseInt(sanitized.substring(start, start + 2), 16);
    if (isNaN(v)) return null;
    return Math.round(v * (1 - k));
  };
  const r = channel(0);
  const g = channel(2);
  const b = channel(4);
  if (r === null || g === null || b === null) return hex;
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function relativeLuminance(hex: string): number | null {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return null;
  const toLinear = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(parseInt(sanitized.substring(0, 2), 16));
  const g = toLinear(parseInt(sanitized.substring(2, 4), 16));
  const b = toLinear(parseInt(sanitized.substring(4, 6), 16));
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function readableForegroundHsl(hex: string): string {
  const l = relativeLuminance(hex);
  if (l === null) return "0 0% 98%";
  return l > 0.5 ? "0 0% 9%" : "0 0% 98%";
}

export function normalizeForUrl(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
