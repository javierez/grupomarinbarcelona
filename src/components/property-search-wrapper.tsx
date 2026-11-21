import {
  getProvinces,
  getPriceRange,
  getSubtypeOptions,
} from "~/server/queries/search-options";
import { opcionesBuscador, SEARCH_PROPERTY_TYPES } from "~/lib/search-utils";
import { PropertySearch } from "./property-search";
import { env } from "~/env";
import { getFeaturesProps } from "~/server/queries/website-config";
import { getLogo } from "~/server/queries/logo";
import { isAccount137 } from "~/lib/account-overrides/137";

/**
 * The full home search (`hero_props.buscador = "completo"`). `accountId` only
 * comes from the CRM preview, which renders another account from this same
 * deployment; everywhere else it is the site's own. It only feeds the first
 * paint: when a filter changes, the browser asks `locations-navegador`, which
 * always answers for the site's own account.
 */
export async function PropertySearchWrapper({
  accountId: accountIdArg,
}: { accountId?: bigint } = {}) {
  // Validate NEXT_PUBLIC_ACCOUNT_ID exists before converting to BigInt
  if (!accountIdArg && !env.NEXT_PUBLIC_ACCOUNT_ID) {
    throw new Error("NEXT_PUBLIC_ACCOUNT_ID is not defined in environment variables");
  }
  const accountId = accountIdArg ?? BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);
  // Ana Díaz (137) lleva su logo encima del buscador, como en la v1.
  const acct137 = isAccount137(accountIdArg);
  const [provinces, salePrices, rentPrices, subtypeOptions, features, logoUrl] =
    await Promise.all([
      getProvinces(accountId),
      getPriceRange(accountId, "for-sale"),
      getPriceRange(accountId, "for-rent"),
      getSubtypeOptions(accountId),
      getFeaturesProps(accountIdArg),
      acct137 ? getLogo(accountIdArg) : null,
    ]);

  // Misma lista que la barra de resultados: antes la home ofrecía 6 tipos y la
  // barra 9, así que una oficina solo se podía buscar desde la segunda.
  return (
    <PropertySearch
      provinces={provinces}
      propertyTypes={SEARCH_PROPERTY_TYPES}
      subtypeOptions={subtypeOptions}
      priceRanges={{ "for-sale": salePrices, "for-rent": rentPrices }}
      opciones={opcionesBuscador(features)}
      logoUrl={logoUrl}
    />
  );
}
