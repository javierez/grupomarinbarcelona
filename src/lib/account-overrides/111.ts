// Hardcoded overrides for account 111 (Inmobiliaria Burgo Nuevo), ported from
// the v1 template so the site can move to v2 unchanged. Its /aviso-legal and
// /proteccion-de-datos are its own lawyer's texts (LSSI heading, Barigle
// Inversiones SL), not the generic pages filled from `accounts`. They live in
// app/aviso-legal/burgo-nuevo.tsx and app/proteccion-de-datos/burgo-nuevo.tsx.
// When 111 gets its own repo, this file and those two go there.

export const ACCOUNT_111_ID = "111";

/** See isAccount155 for why the CRM preview passes `accountId`. */
export function isAccount111(accountId?: bigint | string): boolean {
  const id = accountId?.toString() ?? process.env.NEXT_PUBLIC_ACCOUNT_ID;
  return id === ACCOUNT_111_ID;
}
