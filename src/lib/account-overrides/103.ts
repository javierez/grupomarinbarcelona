// Hardcoded label overrides for account 103.
// Renames a few navigation/category labels without touching the underlying
// routes or data model.

export const ACCOUNT_103_ID = "103";

/**
 * True when we are rendering for this account.
 *
 * `accountId` is only passed by the CRM preview, which renders an ARBITRARY
 * account from this one deployment. Omitted everywhere else, where the
 * deployment's own env var is the right answer.
 */
export function isAccount103(accountId?: bigint | string): boolean {
  const id = accountId?.toString() ?? process.env.NEXT_PUBLIC_ACCOUNT_ID;
  return id === ACCOUNT_103_ID;
}
