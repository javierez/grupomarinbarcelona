import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL ?? process.env.POSTGRES_URL_NON_POOLING, { ssl: "require", max: 1 });
const a = await sql`select account_id, name, website from accounts where account_id = 103`;
console.log(a);
const w = await sql`select * from website_config where account_id = 103`;
for (const r of w) for (const [k,v] of Object.entries(r)) console.log("==",k,"\n", typeof v==="string"? v.slice(0,3000): v);
await sql.end();
