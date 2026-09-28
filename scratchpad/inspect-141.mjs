import postgres from "postgres";
const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
const sql = postgres(url, { ssl: "require", max: 1 });
const rows = await sql`SELECT features_props::jsonb ->> 'nosotrosLayout' AS layout, about_props::jsonb -> 'values' AS values, about_props::jsonb ->> 'showKPI' AS showkpi, about_props::jsonb ->> 'kpi3Name' AS kpi3name, about_props::jsonb ->> 'kpi3Data' AS kpi3data FROM website_config WHERE account_id = 141`;
console.log(JSON.stringify(rows[0], null, 2));
await sql.end();
