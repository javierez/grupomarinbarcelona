/**
 * Las dos fotos de una tarjeta de inmueble (listado, portada, mapa), con la
 * marca de agua de la agencia cuando la tiene puesta.
 *
 * La marca no se pinta aquí: el CRM la hornea en S3 al publicar
 * (`accounts/{id}/watermarked/{propertyId}/image_{orden}.jpg`) y la ficha ya la
 * usaba. Las tarjetas enseñaban la foto original, así que el inmueble salía
 * sin marca justo donde más se ve. Va con la original de reserva: si el CRM
 * aún no ha horneado esa foto, la tarjeta cae a ella en vez de al marcador.
 *
 * Misma cadena que la ficha y que el CRM (`apply-watermarks.ts`): lo que diga
 * el anuncio y, si no dice nada, lo de la cuenta.
 */

export type CardImages = {
  imageUrl: string | null;
  imageUrl2: string | null;
  /** La original, solo cuando `imageUrl` es la copia con marca. */
  imageUrlFallback: string | null;
  imageUrl2Fallback: string | null;
};

function parseWatermark(raw: unknown): { enabled?: boolean } | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as { enabled?: boolean }) : null;
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? (raw as { enabled?: boolean }) : null;
}

/** `listings.watermark_props.enabled` manda; sin él, el de la cuenta. */
export function watermarkOn(listingWatermarkProps: unknown, accountEnabled: boolean): boolean {
  const enabled = parseWatermark(listingWatermarkProps)?.enabled;
  return typeof enabled === "boolean" ? enabled : accountEnabled;
}

export function resolveCardImages(
  row: {
    imageUrl: string | null;
    imageUrl2: string | null;
    imageOrder: number | null;
    imageOrder2: number | null;
  },
  enabled: boolean,
  /** Ruta de la copia con marca para un `image_order`; null si no hay bucket. */
  watermarkedUrl: (imageOrder: number) => string | null,
): CardImages {
  const swap = (url: string | null, order: number | null) => {
    if (!enabled || !url || order == null) return { url, fallback: null };
    const marked = watermarkedUrl(order);
    return marked ? { url: marked, fallback: url } : { url, fallback: null };
  };
  const first = swap(row.imageUrl, row.imageOrder);
  const second = swap(row.imageUrl2, row.imageOrder2);
  return {
    imageUrl: first.url,
    imageUrl2: second.url,
    imageUrlFallback: first.fallback,
    imageUrl2Fallback: second.fallback,
  };
}
