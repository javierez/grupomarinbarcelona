import { db } from "../db";
import { accounts } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { cache } from "react";
import { faltaLaVista } from "~/lib/pg-error";
import { getContactProps } from "./contact";

export type AjustesDeLaWeb = {
  /** `preferences.listingLanguages`, tal cual. */
  listingLanguages: unknown;
  /** `portal_settings.contactAssignment`, tal cual. */
  contactAssignment: unknown;
};

type FilaDeAjustes = { preferences: unknown; portal_settings: unknown };

/**
 * Lo único que la web lee de `accounts.preferences` y `portal_settings`, que
 * guardan llaves (externalApiToken, claves de portales). Con el rol de la web
 * (`web_<id>`) esas columnas dan «permission denied»: sale de la vista
 * `web_cuenta`, que solo trae la fila de ese rol y estos dos valores.
 *
 * Sin fila (la web entra con la POSTGRES_URL entera: la vista no sabe de qué
 * cuenta es) o sin vista todavía (migración sin aplicar): de `accounts`, como
 * hasta ahora.
 */
export async function ajustesDeLaWeb(accountId: bigint): Promise<AjustesDeLaWeb> {
  const fila = (await deLaVista(accountId)) ?? (await deAccounts(accountId));
  return {
    listingLanguages: (fila?.preferences as { listingLanguages?: unknown } | null)
      ?.listingLanguages,
    contactAssignment: (fila?.portal_settings as { contactAssignment?: unknown } | null)
      ?.contactAssignment,
  };
}

async function deLaVista(accountId: bigint): Promise<FilaDeAjustes | null> {
  try {
    const filas = await db.execute<FilaDeAjustes>(sql`
      select preferences, portal_settings from web_cuenta
      where account_id = ${accountId.toString()}::bigint
      limit 1`);
    return filas[0] ?? null;
  } catch (error) {
    if (faltaLaVista(error)) return null;
    throw error;
  }
}

async function deAccounts(accountId: bigint): Promise<FilaDeAjustes | null> {
  const [fila] = await db
    .select({ preferences: accounts.preferences, portal_settings: accounts.portalSettings })
    .from(accounts)
    .where(eq(accounts.accountId, accountId))
    .limit(1);
  return fila ?? null;
}

export type AccountInfo = {
  accountId: string;
  name: string;
  shortName: string;
  status: string;
  subscriptionType: string;
  /**
   * `preferences.listingLanguages` tal cual sale del jsonb: los idiomas a los
   * que la agencia traduce sus anuncios. Lo limpia `siteLanguagesFor`.
   */
  listingLanguages: unknown;
};

export const getAccountInfo = cache(
  async (accountId: string): Promise<AccountInfo | null> => {
    try {
      const [[account], ajustes] = await Promise.all([
        db
          .select({
            accountId: accounts.accountId,
            name: accounts.name,
            shortName: accounts.shortName,
            status: accounts.status,
            subscriptionType: accounts.subscriptionType,
          })
          .from(accounts)
          .where(eq(accounts.accountId, BigInt(accountId)))
          .limit(1),
        ajustesDeLaWeb(BigInt(accountId)),
      ]);

      if (!account) {
        return null;
      }

      return {
        accountId: account.accountId.toString(),
        name: account.name,
        shortName: account.shortName?.trim() || account.name,
        status: account.status ?? "",
        subscriptionType: account.subscriptionType ?? "",
        listingLanguages: ajustes.listingLanguages,
      };
    } catch (error) {
      console.error("Error fetching account info:", error);
      return null;
    }
  },
);

export type AccountContact = {
  name: string;
  phone: string | null;
  email: string | null;
};

/**
 * Minimal agency contact card data — name/phone/email straight from the
 * account. Used by the listing page to render an agency card instead of the
 * agent card when the listing's `useAgentPhone` toggle is off ("Cuenta").
 */
export const getAccountContact = cache(
  async (accountId: string): Promise<AccountContact | null> => {
    try {
      const [account] = await db
        .select({
          name: accounts.name,
          shortName: accounts.shortName,
          phone: accounts.phone,
          email: accounts.email,
        })
        .from(accounts)
        .where(eq(accounts.accountId, BigInt(accountId)))
        .limit(1);

      if (!account) return null;

      return {
        name: account.shortName?.trim() || account.name,
        phone: account.phone?.trim() || null,
        email: account.email?.trim() || null,
      };
    } catch (error) {
      console.error("Error fetching account contact:", error);
      return null;
    }
  },
);

export type AccountLegalData = {
  name: string;
  legalName: string;
  accountType: "company" | "person";
  /** Label for tax ID: "CIF" for companies, "NIF" for persons */
  taxIdLabel: string;
  taxId: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  registryDetails: string;
  legalEmail: string;
  privacyEmail: string;
  dpoEmail: string;
  jurisdiction: string;
};

export const getAccountLegalData = cache(
  async (accountId: string): Promise<AccountLegalData | null> => {
    try {
      const [account] = await db
        .select({
          name: accounts.name,
          legalName: accounts.legalName,
          accountType: accounts.accountType,
          taxId: accounts.taxId,
          address: accounts.address,
          phone: accounts.phone,
          email: accounts.email,
          website: accounts.website,
          registryDetails: accounts.registryDetails,
          legalEmail: accounts.legalEmail,
          privacyEmail: accounts.privacyEmail,
          dpoEmail: accounts.dpoEmail,
          jurisdiction: accounts.jurisdiction,
        })
        .from(accounts)
        .where(eq(accounts.accountId, BigInt(accountId)))
        .limit(1);

      if (!account) {
        return null;
      }

      const isCompany = account.accountType === "company";
      const fallbackEmail = account.email?.trim() || "";
      // El teléfono de las páginas legales es el que la web da en Contacto; el
      // de la cuenta, solo si la web no tiene. Muñoz Espasande (180) daba en
      // Cookies un fijo que ya no usan (19-nov-2026), y 10 webs de 42 igual.
      const contacto = await getContactProps(BigInt(accountId));
      const telefonoDeLaWeb = contacto?.offices?.[0]?.phoneNumbers?.main?.trim();

      return {
        name: account.name,
        legalName: account.legalName?.trim() || account.name,
        accountType: isCompany ? "company" : "person",
        taxIdLabel: isCompany ? "CIF" : "NIF",
        taxId: account.taxId?.trim() || "",
        address: account.address?.trim() || "",
        phone: telefonoDeLaWeb || account.phone?.trim() || "",
        email: fallbackEmail,
        website: account.website?.trim() || "",
        registryDetails: account.registryDetails?.trim() || "",
        legalEmail: account.legalEmail?.trim() || fallbackEmail,
        privacyEmail: account.privacyEmail?.trim() || fallbackEmail,
        dpoEmail: account.dpoEmail?.trim() || fallbackEmail,
        jurisdiction: account.jurisdiction?.trim() || "",
      };
    } catch (error) {
      console.error("Error fetching account legal data:", error);
      return null;
    }
  },
);
