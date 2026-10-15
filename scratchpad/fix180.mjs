import postgres from "postgres";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
const s3 = new S3Client({ region: "eu-west-1" });
const B = "vesta-crm-prod-eu-e966e353";
const [row] = await sql`select * from website_config where account_id=180`;
const P = (s) => JSON.parse(s || "{}");
const rb = (s) => s.replaceAll("Dobleese Inmobiliaria", "Muñoz Espasande").replaceAll("Dobleese", "Muñoz Espasande");
const about = P(row.about_props);
for (const m of about.team) {
  if (!m.photo?.includes("doblese.com")) continue;
  let r; for (let i=0;i<4;i++){ try { r = await fetch(m.photo); break; } catch { await new Promise(s=>setTimeout(s,1500)); } } if (!r) { console.log("fail", m.photo); continue; } if (!r.ok) { console.log("skip", m.photo); delete m.photo; continue; }
  const ext = m.photo.split(".").pop(); const key = `accounts/180/team/${m.name.normalize("NFD").replace(/[^\w]+/g,"-").toLowerCase()}.${ext}`;
  await s3.send(new PutObjectCommand({ Bucket: B, Key: key, Body: Buffer.from(await r.arrayBuffer()), ContentType: r.headers.get("content-type") ?? "image/jpeg" }));
  m.photo = `https://${B}.s3.eu-west-1.amazonaws.com/${key}`; console.log("up", key);
}
Object.assign(about, { kpi2Name: "Viviendas gestionadas", kpi2Data: "4.900+" });
const aboutS = rb(JSON.stringify(about));
const seo = P(row.seo_props);
Object.assign(seo, { title: "Muñoz Espasande Inmobiliaria | Inmobiliaria en Gijón", name: "Muñoz Espasande Inmobiliaria", ogTitle: "Muñoz Espasande Inmobiliaria", ogSiteName: "Muñoz Espasande Inmobiliaria", ogImage: P(row.hero_props).backgroundImage });
const footer = P(row.footer_props);
footer.officeLocations[0].phone = "984 485 585"; footer.officeLocations[0].email = "inmobiliaria@munozespasande.com";
footer.copyright = "© 2026 Muñoz Espasande SL. Todos los derechos reservados.";
await sql`update website_config set about_props=${aboutS}, seo_props=${rb(JSON.stringify(seo))}, footer_props=${rb(JSON.stringify(footer))},
  color_props=${JSON.stringify({ primaryColor: "#255665", secondaryColor: "#cfdadd" })}, updated_at=now() where account_id=180`;
const check = await sql`select about_props||seo_props||footer_props||hero_props||contact_props as t from website_config where account_id=180`;
console.log("remaining Dobleese/doblese.com refs:", (check[0].t.match(/Dobleese|doblese\.com\/wp/g) ?? []).length);
await sql.end();
