import postgres from "postgres";
import { writeFileSync } from "node:fs";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });

try {
  const [row] = await sql`select footer_props, contact_props from website_config where account_id = 141`;
  if (!row) throw new Error("account 141 not found");

  // Backup
  writeFileSync(".backups-website-config-141-offices-2026-07-08.json",
    JSON.stringify(row, null, 2));

  const footer = JSON.parse(row.footer_props);
  const contact = JSON.parse(row.contact_props);

  const alreadyFooter = footer.officeLocations?.some(
    (o) => /blanes/i.test(o.name) || o.address?.some((l) => /blanes/i.test(l))
  );
  const alreadyContact = contact.offices?.some(
    (o) => /blanes/i.test(o.name) || /blanes/i.test(o.address?.city ?? "")
  );

  const PHONE = "663946837";           // general contact from the flyer (mobile)
  const EMAIL = "grupomarinbcn@gmail.com";
  const SCHEDULE = {
    weekdays: "Lunes a Viernes: 9:00 - 19:00",
    saturday: "Sábado: 10:00 - 14:00",
    sunday: "Domingo: Cerrado",
  };

  if (!alreadyFooter) {
    footer.officeLocations.push({
      name: "Grupo Marín Blanes",
      address: ["Carrer Cristòfol Colom, 28", "Blanes, Girona"],
      phone: PHONE,
      email: EMAIL,
    });
  }

  if (!alreadyContact) {
    contact.offices.push({
      id: "office-4",
      name: "Grupo Marín Blanes",
      address: { street: "Carrer Cristòfol Colom, 28", city: "Blanes", state: "Girona", country: "España" },
      phoneNumbers: { main: PHONE },
      emailAddresses: { info: EMAIL },
      scheduleInfo: SCHEDULE,
      mapUrl: "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent("Carrer Cristòfol Colom, 28, Blanes, Girona, 17300"),
      isDefault: false,
    });
  }

  await sql`update website_config
    set footer_props = ${JSON.stringify(footer)},
        contact_props = ${JSON.stringify(contact)}
    where account_id = 141`;

  console.log("footer offices:", footer.officeLocations.map((o) => o.name).join(" | "));
  console.log("contact offices:", contact.offices.map((o) => o.name).join(" | "));
  console.log(alreadyFooter && alreadyContact ? "No change (Blanes already present)" : "Blanes office added ✅");
} finally { await sql.end(); }
