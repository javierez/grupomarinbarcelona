import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: ReturnType<typeof postgres> | undefined;
};

// Create PostgreSQL connection with Supabase
const conn =
  globalForDb.conn ??
  postgres(env.POSTGRES_URL, {
    ssl: env.NODE_ENV === "production" ? "require" : "prefer",
    max: 5,
    idle_timeout: 10,
    max_lifetime: 60 * 5, // 5 minutes - release connections faster
    connect_timeout: 30,
  });

// 🚨 12-nov-2026 — postgres.js pide los tipos de array (~740 filas de pg_type)
// en CADA conexión nueva, y aquí se reciclan cada pocos minutos: ~1 vez por
// segundo entre todas las webs, ~60 GB de egress de Supabase en seis semanas.
// Los analizadores que deja la primera viven en `options.shared`, que comparten
// todas las conexiones del cliente: las siguientes ya no preguntan. Mismo
// arreglo que `src/server/db/factory.ts` del CRM (27-sep-2026).
const sharedTypes = conn.options as unknown as {
  shared: { typeArrayMap: Record<string, number> };
};
Object.defineProperty(sharedTypes, "fetch_types", {
  get: () => Object.keys(sharedTypes.shared.typeArrayMap).length === 0,
  configurable: true,
});

// Cache connection in development to avoid HMR reconnections
if (env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
