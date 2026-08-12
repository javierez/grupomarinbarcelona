import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  // What table holds users? find columns with email
  const tbls = await sql`
    select table_name, column_name from information_schema.columns
    where column_name ilike '%email%' and table_schema='public'
    order by table_name`;
  console.log("=== email columns ===");
  console.log(tbls.map(t=>`${t.table_name}.${t.column_name}`).join("\n"));

  console.log("\n=== search 'users' table for the email ===");
  try {
    const u = await sql`select id, email, account_id, first_name, last_name from users where email ilike ${'%josemariamulero%'}`;
    console.log(u.length? JSON.stringify(u,null,2) : "no users row matches josemariamulero");
  } catch(e){ console.log("users query err:", e.message); }

  console.log("\n=== all users for account 103 ===");
  try {
    const u2 = await sql`select id, email, first_name, last_name from users where account_id = 103`;
    console.log(u2.length? JSON.stringify(u2,null,2) : "no users for account 103");
  } catch(e){ console.log("err:", e.message); }
} finally { await sql.end(); }
