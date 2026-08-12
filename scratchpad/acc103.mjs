import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  const [a] = await sql`select name, short_name, phone, email from accounts where account_id=103`;
  console.log("Agency card (accounts row) shows:", JSON.stringify(a));
} finally { await sql.end(); }
