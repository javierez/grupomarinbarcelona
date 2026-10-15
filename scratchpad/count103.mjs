import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
const UID = "JBsAuXafBuxt1qN8IjQQxXC8fIM6Qgha";
try {
  // Mirror the website grid/detail visibility filter: isActive AND status not draft/discarded/sold/rented
  const visible = sql`is_active = true and status not in ('Draft','Descartado','Vendido','Alquilado')`;

  const [tot] = await sql`select count(*)::int n from listings where account_id=103 and agent_id=${UID} and ${visible}`;
  console.log("Website-VISIBLE listings where Mulero is the agent:", tot.n);

  const rows = await sql`
    select coalesce(use_agent_phone,false) as uap, count(*)::int n
    from listings where account_id=103 and agent_id=${UID} and ${visible}
    group by 1 order by 1`;
  for (const r of rows) {
    console.log(`  use_agent_phone=${r.uap}: ${r.n} listings  ->  ${r.uap ? "AGENT card shows (name + phone + EMAIL josemariamulero@gmail.com)" : "agency card shows (agent hidden)"}`);
  }

  // What phone/email/image does his user record expose?
  const [u] = await sql`select first_name,last_name,email,phone,image from users where id=${UID}`;
  console.log("\nHis user record shown on agent card:", JSON.stringify(u));
} finally { await sql.end(); }
