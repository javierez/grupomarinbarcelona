import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
try {
  const [row] = await sql`select about_props from website_config where account_id = 103`;
  const about = row?.about_props ? JSON.parse(row.about_props) : null;
  const team = about?.team;
  console.log("team members configured on site:", Array.isArray(team) ? team.length : "(none / no team array)");
  if (Array.isArray(team)) {
    for (const m of team) console.log(" -", m.name ?? "(no name)", "| role:", m.role ?? "-", "| userId:", m.userId ?? "-", "| email field?", m.email ?? "none");
  }
  const MULERO_UID = "JBsAuXafBuxt1qN8IjQQxXC8fIM6Qgha";
  const raw = row?.about_props ?? "";
  console.log("\nabout_props references Mulero userId?", raw.includes(MULERO_UID));
  console.log("about_props references 'mulero' text?", /mulero/i.test(raw));
} finally { await sql.end(); }
