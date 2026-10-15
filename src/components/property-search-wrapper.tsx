import {
  getProvinces,
  getPriceRange,
  getSubtypeOptions,
} from "~/server/actions/locations";
import { SEARCH_PROPERTY_TYPES } from "~/lib/search-utils";
import { PropertySearch } from "./property-search";
import { env } from "~/env";

export async function PropertySearchWrapper() {
  // Validate NEXT_PUBLIC_ACCOUNT_ID exists before converting to BigInt
  if (!env.NEXT_PUBLIC_ACCOUNT_ID) {
    throw new Error("NEXT_PUBLIC_ACCOUNT_ID is not defined in environment variables");
  }
  const accountId = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);
  const [provinces, salePrices, rentPrices, subtypeOptions] = await Promise.all([
    getProvinces(accountId),
    getPriceRange(accountId, "for-sale"),
    getPriceRange(accountId, "for-rent"),
    getSubtypeOptions(accountId),
  ]);

  // Misma lista que la barra de resultados: antes la home ofrecía 6 tipos y la
  // barra 9, así que una oficina solo se podía buscar desde la segunda.
  return (
    <PropertySearch
      provinces={provinces}
      propertyTypes={SEARCH_PROPERTY_TYPES}
      subtypeOptions={subtypeOptions}
      priceRanges={{ "for-sale": salePrices, "for-rent": rentPrices }}
      accountId={env.NEXT_PUBLIC_ACCOUNT_ID}
    />
  );
}
