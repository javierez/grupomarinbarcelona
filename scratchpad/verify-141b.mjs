import postgres from "postgres";
const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
const sql = postgres(url, { ssl: "require", max: 1 });
const rows = await sql`SELECT features_props::jsonb -> 'sections' AS sections FROM website_config WHERE account_id = 141`;
console.log(JSON.stringify(rows[0], null, 2));
await sql.end();
