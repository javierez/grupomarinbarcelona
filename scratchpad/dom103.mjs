import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  const cols = await sql`select column_name from information_schema.columns where table_name='accounts' and (column_name ilike '%domain%' or column_name ilike '%url%' or column_name ilike '%web%' or column_name ilike '%site%')`;
  console.log("account url-ish columns:", cols.map(c=>c.column_name).join(", ")||"(none)");
  if (cols.length){
    const sel = cols.map(c=>c.column_name).join(", ");
    const r = await sql.unsafe(`select ${sel} from accounts where account_id=103`);
    console.log("values:", JSON.stringify(r[0]));
  }
} finally { await sql.end(); }
