"use server";

// Lo que el feed pide desde el navegador. Toda función de aquí se puede llamar
// desde internet con los argumentos que quiera quien llama: los ids se limpian
// y se topan (`feedIds`), y la query solo devuelve fotos de inmuebles que esta
// web publica (la cuenta es NEXT_PUBLIC_ACCOUNT_ID, dentro de la query).
import { feedIds } from "~/lib/feed-ids";
import {
  getImagesForListings,
  type FeedImage,
} from "~/server/queries/listings";

/** Todas las fotos de unos inmuebles del feed, por `propertyId`. */
export async function fetchFeedImages(
  propertyIds: string[],
): Promise<Record<string, FeedImage[]>> {
  return Object.fromEntries(await getImagesForListings(feedIds(propertyIds)));
}
