import postgres from "postgres";
const url = process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING;
const sql = postgres(url, { ssl: "require", max: 1 });
try {
  const rows = await sql`select promo_cards_props, features_props from website_config where account_id = 141`;
  for (const r of rows) {
    for (const [k,v] of Object.entries(r)) {
      console.log("=====", k, "=====");
      console.log(v ?? "(null)");
      console.log();
    }
  }
  // also count listings for account
  const c = await sql`select count(*)::int as n from listings where account_id = 141`;
  console.log("listings count for 141:", c[0]?.n);
} catch(e){ console.error("ERR", e.message); } finally { await sql.end(); }
