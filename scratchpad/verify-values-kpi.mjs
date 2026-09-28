import postgres from "postgres";
const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
const sql = postgres(url, { ssl: "require", max: 1 });
const r = await sql`SELECT about_props::jsonb -> 'values' AS values, about_props::jsonb ->> 'showKPI' AS showkpi FROM website_config WHERE account_id = 141`;
console.log(JSON.stringify(r[0]));
await sql.end();
