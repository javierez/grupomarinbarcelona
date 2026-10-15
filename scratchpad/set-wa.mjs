import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  const [row] = await sql`select contact_props from website_config where account_id = 141`;
  const contact = JSON.parse(row.contact_props);
  contact.whatsappNumber = "663946837";
  await sql`update website_config set contact_props = ${JSON.stringify(contact)} where account_id = 141`;
  console.log("whatsappNumber set to:", contact.whatsappNumber);
} finally { await sql.end(); }
