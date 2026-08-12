import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  const r = await sql`select logo, brand_color, secondary_color, accent_color from website_config where account_id = 141`;
  console.log(JSON.stringify(r[0], null, 2));
} catch(e){
  // column names may differ; dump all columns
  const r = await sql`select * from website_config where account_id = 141`;
  const row = r[0]||{};
  for (const k of Object.keys(row)) if (/color|brand|logo/i.test(k)) console.log(k, "=", row[k]);
} finally { await sql.end(); }
