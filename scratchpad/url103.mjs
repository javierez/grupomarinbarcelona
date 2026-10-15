import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
const UID = "JBsAuXafBuxt1qN8IjQQxXC8fIM6Qgha";
try {
  const [seo] = await sql`select seo_props from website_config where account_id=103`;
  const s = seo?.seo_props ? JSON.parse(seo.seo_props) : {};
  console.log("seo url:", s.url, "| name:", s.name);
  // a sample visible listing where Mulero is the agent
  const rows = await sql`
    select listing_id, property_id, title, short_description, use_agent_phone
    from listings
    where account_id=103 and agent_id=${UID}
      and is_active=true and status not in ('Draft','Descartado','Vendido','Alquilado')
    limit 3`;
  console.log("sample listings:", JSON.stringify(rows,null,2));
} finally { await sql.end(); }
