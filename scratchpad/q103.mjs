import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  const [row] = await sql`select * from website_config where account_id = 103`;
  if (!row) { console.log("No website_config for account 103"); }
  else {
    const needle = /mulero|josemaria|participa|todos los usuarios|all users|usuarios/i;
    for (const [k,v] of Object.entries(row)) {
      if (typeof v === "string" && needle.test(v)) {
        console.log("### HIT in column:", k);
        // print surrounding context of each match
        for (const m of v.matchAll(needle)) {
          const s = Math.max(0, m.index-160), e = Math.min(v.length, m.index+200);
          console.log("...", v.slice(s,e), "...\n");
        }
      }
    }
    // Also explicitly scan for any gmail addresses
    console.log("=== all @gmail / email mentions across config ===");
    for (const [k,v] of Object.entries(row)) {
      if (typeof v === "string") {
        const emails = v.match(/[\w.+-]+@[\w.-]+\.\w+/g);
        if (emails) console.log(k, "->", [...new Set(emails)].join(", "));
      }
    }
  }
} finally { await sql.end(); }
