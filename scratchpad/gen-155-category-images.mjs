/**
 * One-off: generate the two category-card images (Venta / Inversiones) for
 * account 155 (GO4 Asturias Inmobiliaria) with Gemini, keyed to the account's
 * own market (Asturias: casas de pueblo, fincas rústicas, Oviedo) and toned
 * against its existing hero image so the homepage reads as one palette.
 *
 * Dry run by default → writes JPEGs to scratchpad/. Pass --apply to upload to
 * S3 under accounts/155/website/categories/ and patch promo_cards_props.
 */
import { writeFileSync, readFileSync } from "node:fs";
import sharp from "sharp";
import postgres from "postgres";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const apply = process.argv.includes("--apply");
// --reuse: skip generation and upload the JPEGs already sitting in scratchpad/,
// so what ships is exactly what was reviewed in the dry run.
const reuse = process.argv.includes("--reuse");
// --only venta|inversiones: regenerate a single card, leave the other file alone.
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx === -1 ? null : process.argv[onlyIdx + 1];
const ACCOUNT_ID = "155";
const OUT_DIR = "scratchpad";
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-2.5-flash-image";
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const HERO =
  "https://vesta-crm-prod-eu-e966e353.s3.eu-west-1.amazonaws.com/accounts/155/hero/background_YTh2wMJw.jpg";

// Shared tone directive — pulled from the account's hero (misty Asturian
// mountains, wood + slate, muted greens/greys) and its gold accent #c79b33.
const TONE =
  // Realism first: describe an actual camera/film result, then the light.
  "A real, unretouched photograph taken by a professional architectural photographer on a " +
  "full-frame DSLR (Canon EOS R5, 35mm f/4 lens, ISO 100, tripod, straight verticals). " +
  "RAW file, natural optics: true-to-life colour, realistic dynamic range with genuinely bright " +
  "highlights and soft open shadows, accurate perspective, fine surface texture and grain, " +
  "subtle lens vignetting, real-world imperfections — weathered stone, slightly uneven paint, " +
  "moss in joints, a few wilted leaves, minor dust and streaks. " +
  "Bright sunny day: clear blue sky with a few small clouds, strong late-morning sunshine, " +
  "crisp directional shadows, vivid fresh greens, sunlit warm stone and wood. Airy and inviting. " +
  "STRICTLY NOT: 3D render, CGI, Unreal Engine, architectural visualisation, digital painting, " +
  "illustration, matte painting, AI-looking plastic or waxy surfaces, over-smooth flawless " +
  "materials, impossible symmetry, glowing edges, oversaturated postcard colours, heavy HDR, " +
  "tilt-shift miniature look. It must be indistinguishable from a real photograph. " +
  "No people, no text, no logos, no watermarks, no signage.";

const CARDS = [
  {
    id: "venta",
    title: "Venta",
    subtitle: "Pisos y casas en venta",
    href: "/venta-propiedades/todas-ubicaciones",
    prompt:
      "A restored traditional Asturian village house (casa de pueblo) in northern Spain on a " +
      "bright sunny day: stone and whitewashed walls lit by direct sunlight, dark slate roof, " +
      "wooden gallery balcony with flowers, tidy garden, vivid green rolling hills and clearly " +
      "visible sunlit mountains behind it under a blue sky. " +
      "Three-quarter exterior view, the house centred and filling most of the frame. " +
      TONE,
  },
  {
    id: "inversiones",
    title: "Inversiones",
    subtitle: "Rentabilidad y oportunidad",
    href: "/inversiones",
    prompt:
      "A handsome, WELL-MAINTAINED early-20th-century apartment building in central Oviedo, " +
      "Asturias on a bright sunny day: clean pale stone and freshly painted render in good " +
      "repair, tall windows, wrought-iron balconies and the white-framed glazed galleries " +
      "typical of northern Spain, geraniums on a couple of balconies, sunlight raking across " +
      "the façade and sparkling in the glass, blue sky above the roofline, a sunlit street tree " +
      "at the edge of the frame, tidy pavement below. Viewed from across a quiet street at a " +
      "slight angle so the building has depth. It must look cared-for and desirable — NO " +
      "peeling paint, no damp stains, no crumbling render, no abandonment, nothing derelict. " +
      TONE,
  },
];

async function fetchRef(url) {
  const res = await fetch(url);
  if (res.ok) {
    return {
      data: Buffer.from(await res.arrayBuffer()).toString("base64"),
      mimeType: res.headers.get("content-type") ?? "image/jpeg",
    };
  }
  // Bucket objects aren't publicly readable → pull it with credentials.
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: process.env.AWS_REGION });
  const key = new URL(url).pathname.replace(/^\//, "");
  const obj = await client.send(
    new GetObjectCommand({ Bucket: process.env.S3_CONSOLIDATED_BUCKET, Key: key }),
  );
  return {
    data: Buffer.from(await obj.Body.transformToByteArray()).toString("base64"),
    mimeType: obj.ContentType ?? "image/jpeg",
  };
}

async function generate(prompt, ref) {
  const parts = [];
  if (ref) {
    parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.data } });
    parts.push({
      text:
        "Use the attached photograph ONLY as a colour/tone/light reference — do not copy " +
        "its subject or composition. Generate a new photograph:\n\n" +
        prompt,
    });
  } else {
    parts.push({ text: `Generate a photograph:\n\n${prompt}` });
  }
  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
  };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`gemini ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  const responseParts = json.candidates?.[0]?.content?.parts ?? [];
  const img = responseParts.find((p) => p.inlineData?.data);
  if (!img) throw new Error(`no image in response: ${JSON.stringify(json).slice(0, 400)}`);
  return Buffer.from(img.inlineData.data, "base64");
}

// 4:3 at 1400px wide — covers the desktop card (~4:3) and still crops cleanly
// to the mobile 4:5 with the subject centred.
const toCardJpeg = (buf) =>
  sharp(buf).resize(1400, 1050, { fit: "cover", position: "centre" }).jpeg({ quality: 86 }).toBuffer();

// The hero still image is missing from the bucket for this account (the hero is
// a video), so the tone lives in the prompt and the reference is best-effort.
let ref = null;
try {
  ref = await fetchRef(HERO);
} catch (err) {
  console.log(`(no reference image: ${err.message} — using prompt tone only)`);
}
const results = [];
for (const card of CARDS) {
  const path = `${OUT_DIR}/155-category-${card.id}.jpg`;
  let jpeg;
  if (reuse || (only && only !== card.id)) {
    // Upload exactly what was reviewed instead of rolling fresh images.
    jpeg = readFileSync(path);
    process.stdout.write(`reusing ${card.id}… `);
  } else {
    process.stdout.write(`generating ${card.id}… `);
    jpeg = await toCardJpeg(await generate(card.prompt, ref));
    writeFileSync(path, jpeg);
  }
  const meta = await sharp(jpeg).metadata();
  console.log(`${path} (${meta.width}x${meta.height}, ${Math.round(jpeg.length / 1024)}kB)`);
  results.push({ card, path, jpeg });
}

if (!apply) {
  console.log("\nDRY RUN — review the files above, then re-run with --apply");
  process.exit(0);
}

const s3 = new S3Client({ region: process.env.AWS_REGION });
const bucket = process.env.S3_CONSOLIDATED_BUCKET;
const stamp = Date.now();
const cards = [];
for (const [i, { card, jpeg }] of results.entries()) {
  const key = `accounts/${ACCOUNT_ID}/website/categories/${card.id}_${stamp}.jpg`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: jpeg,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const imageUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  console.log(`uploaded ${imageUrl}`);
  cards.push({
    id: card.id,
    kind: "static_link",
    position: i,
    title: card.title,
    subtitle: card.subtitle,
    href: card.href,
    imageUrl,
  });
}

const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
const [before] = await sql`select promo_cards_props from website_config where account_id = ${ACCOUNT_ID}`;
writeFileSync(
  `.backups-website-config-${ACCOUNT_ID}-promocards-${stamp}.json`,
  JSON.stringify(before, null, 2),
);
await sql`update website_config set promo_cards_props = ${JSON.stringify(cards)} where account_id = ${ACCOUNT_ID}`;
console.log("promo_cards_props updated:", cards.map((c) => `${c.title} → ${c.imageUrl}`));
await sql.end();
