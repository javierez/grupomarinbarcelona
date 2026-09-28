import postgres from "postgres";
const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
const sql = postgres(url, { ssl: "require", max: 1 });
const rows = await sql`SELECT about_props::jsonb ->> 'nosotrosHeroImage' AS hero FROM website_config WHERE account_id = 141`;
console.log("nosotrosHeroImage =", rows[0].hero);
await sql.end();
