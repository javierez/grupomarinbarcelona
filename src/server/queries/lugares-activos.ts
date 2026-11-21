import "server-only";

import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { locations } from "~/server/db/schema";

// 🚨 19-nov-2026 — las ciudades activas de toda España (~4.300 filas) se pedían
// en cada página con ciudad en la URL: una consulta cada 5 s entre todas las
// webs y el 38 % de todo lo que sacaba Supabase desde septiembre. El 18-nov se
// pasó la cuota de egress y Supabase cortó el tiempo real del CRM. Cambian
// muy de vez en cuando: una hora en la caché de Next, y las provincias igual.

export const ciudadesActivas = unstable_cache(
  async () =>
    (
      await db
        .selectDistinct({ city: locations.city })
        .from(locations)
        .where(eq(locations.isActive, true))
    ).map((r) => r.city),
  ["lugares-activos-ciudades"],
  { revalidate: 3600 },
);

export const provinciasActivas = unstable_cache(
  async () =>
    (
      await db
        .selectDistinct({ province: locations.province })
        .from(locations)
        .where(eq(locations.isActive, true))
    ).map((r) => r.province),
  ["lugares-activos-provincias"],
  { revalidate: 3600 },
);
