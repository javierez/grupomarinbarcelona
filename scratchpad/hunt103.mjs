import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
const UID = "JBsAuXafBuxt1qN8IjQQxXC8fIM6Qgha";
const RX = /mulero|josemaria|jose\s*mar[ií]a|josemariamulero/i;
try {
  // 1. Every website_config column
  const [cfg] = await sql`select * from website_config where account_id = 103`;
  console.log("=== website_config scan ===");
  let anyCfg = false;
  for (const [k,v] of Object.entries(cfg||{})) {
    if (typeof v === "string" && (RX.test(v) || v.includes(UID))) { console.log("HIT:", k); anyCfg = true; }
  }
  if (!anyCfg) console.log("no reference to Mulero (name/email/userId) in ANY website_config column");

  // 2. Is he the assigned agent on any listing for 103? (property pages may show agent)
  console.log("\n=== listings assigned to this user ===");
  // find agent/user columns on listings
  const cols = await sql`select column_name from information_schema.columns where table_name='listings' and (column_name ilike '%agent%' or column_name ilike '%user%' or column_name ilike '%owner%' or column_name ilike '%assign%')`;
  console.log("listing agent-ish columns:", cols.map(c=>c.column_name).join(", ") || "(none)");

  // 3. property_images / listings tied to his userId — try common columns
  for (const col of cols.map(c=>c.column_name)) {
    try {
      const r = await sql.unsafe(`select count(*)::int n from listings where account_id=103 and ${col} = $1`, [UID]);
      console.log(`listings where ${col} = Mulero:`, r[0].n);
    } catch(e){ /* type mismatch, skip */ }
  }
} finally { await sql.end(); }
