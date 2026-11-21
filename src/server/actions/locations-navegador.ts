"use server";

// Lo que el buscador pide desde el navegador al cambiar un filtro. Toda
// función de aquí se puede llamar desde internet con los argumentos que
// quiera quien llama, así que la cuenta no se recibe: es la de esta web.
// Las consultas viven en `~/server/queries/search-options` (solo servidor).
import { env } from "~/env";
import type { NonLocationFilters } from "~/server/queries/search-filters";
import {
  getCitiesAndNeighborhoodsByProvince as citiesOf,
  getProvinces as provincesOf,
} from "~/server/queries/search-options";

const accountId = () => BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

export async function getProvinces(filters?: NonLocationFilters) {
  return provincesOf(accountId(), filters);
}

export async function getCitiesAndNeighborhoodsByProvince(
  province: string,
  filters?: NonLocationFilters,
) {
  return citiesOf(String(province), accountId(), filters);
}
