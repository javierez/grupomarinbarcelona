import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  const r = await sql`select footer_props, contact_props, seo_props from website_config where account_id = 141`;
  const row = r[0]||{};
  for (const k of ["footer_props","contact_props","seo_props"]) {
    console.log("=====", k, "=====");
    console.log(row[k] ?? "(null)");
    console.log();
  }
} finally { await sql.end(); }
