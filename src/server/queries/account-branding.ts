import { getSiteConfigRow } from "~/server/queries/site-config";

/**
 * Logo, nombre, teléfono y correo de la agencia para los correos que salen de
 * los formularios de la web (/vender completo y corto). Antes vivía dentro de
 * server/actions/property-listing.ts; está aquí para que lo usen las dos
 * actions sin exportarlo desde un fichero "use server" (lo haría llamable
 * desde internet con cualquier cuenta).
 *
 * Lee la misma fila que pinta la web (`getSiteConfigRow`), en caché.
 */
export async function getAccountBranding(accountId: bigint) {
  const config = await getSiteConfigRow(accountId);

  let agencyName = "Nuestra agencia";
  let agencyPhone: string | null = null;
  let agencyEmail: string | null = null;

  if (config?.seoProps) {
    try {
      const seo = JSON.parse(config.seoProps) as { name?: string; ogSiteName?: string };
      agencyName = seo.name ?? seo.ogSiteName ?? agencyName;
    } catch { /* ignore */ }
  }

  if (config?.contactProps) {
    try {
      const cp = JSON.parse(config.contactProps) as {
        offices?: Array<{ isDefault?: boolean; phoneNumbers?: { main?: string }; emailAddresses?: { info?: string } }>;
      };
      const office = cp.offices?.find((o) => o.isDefault) ?? cp.offices?.[0];
      agencyPhone = office?.phoneNumbers?.main ?? null;
      agencyEmail = office?.emailAddresses?.info ?? null;
    } catch { /* ignore */ }
  }

  return {
    logoUrl: config?.logo ? String(config.logo) : null,
    agencyName,
    agencyPhone,
    agencyEmail,
  };
}
