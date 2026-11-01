import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "~/env";

/**
 * Verify the HMAC token issued by vesta admin's `generatePreviewTokenAction`.
 * Returns true when token is valid and not expired.
 */
export function verifyPreviewToken(args: {
  token: string;
  accountId: string | bigint;
  exp: number;
}): boolean {
  const secret = env.PREVIEW_HMAC_SECRET;
  if (!secret) return false;
  if (!args.token || !args.exp) return false;
  if (Number.isNaN(args.exp) || args.exp < Date.now()) return false;

  const expected = createHmac("sha256", secret)
    .update(`${String(args.accountId)}:${args.exp}`)
    .digest("hex");

  if (expected.length !== args.token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(args.token));
  } catch {
    return false;
  }
}

/**
 * Resolve which account a `/preview/*` request is for, from the query string
 * forwarded by the middleware as `x-preview-qs`.
 *
 * Returns undefined unless the HMAC token checks out — the layout renders the
 * account's logo, colours, contact details and social links, so an unverified
 * `?accountId=` would leak another agency's branding to anyone who guessed it.
 */
export function previewAccountIdFromQuery(
  search: string | null | undefined,
): bigint | undefined {
  if (!search) return undefined;
  const sp = new URLSearchParams(search);
  const accountId = sp.get("accountId");
  const token = sp.get("token");
  const exp = Number(sp.get("exp"));
  if (!accountId || !token || !exp) return undefined;
  if (!verifyPreviewToken({ token, accountId, exp })) return undefined;
  try {
    return BigInt(accountId);
  } catch {
    return undefined;
  }
}
