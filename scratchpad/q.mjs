import postgres from "postgres";
const sql = postgres(process.env.POSTGRES_URL, { ssl: "require", max: 1 });
const q = process.argv[2];
console.log(JSON.stringify(await sql.unsafe(q), (k,v)=>typeof v==='bigint'?v.toString():v, 2));
await sql.end();
