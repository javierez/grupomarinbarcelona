// Lo que la ficha pública manda al navegador. Sin framework: afirma, imprime
// un resumen y sale != 0.
//
//   pnpm tsx src/lib/ficha-publica.test.ts
import { readFileSync } from "node:fs";
import { CAMPOS_CARACTERISTICAS, fichaPublica } from "./ficha-publica";
import { toPublicDetailLocation } from "./location-privacy";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const json = (v: unknown) =>
  JSON.stringify(v, (_k, x: unknown) => (typeof x === "bigint" ? x.toString() : x));

// Un anuncio como lo devuelve getListingDetails: "solo zona", precio oculto y
// la tarjeta de la oficina (useAgentPhone apagado).
const anuncio = {
  listingId: 4512n,
  propertyId: 9031n,
  title: "Piso en Calle Ancha 14",
  price: "245000.00",
  hidePrice: true,
  status: "En Venta",
  street: "Calle Ancha 14",
  addressDetails: "3º B",
  postalCode: "24003",
  city: "León",
  province: "León",
  latitude: "42.598765",
  longitude: "-5.567123",
  fcLocationVisibility: 3,
  visibilityMode: 1,
  cadastralReference: "9872023VH5797S0001WX",
  viewCount: 318,
  inquiryCount: 12,
  idealistaReference: "ID-88",
  agentId: "u_7f3",
  isActive: true,
  useAgentPhone: false,
  agentName: "Marta Gil",
  agentImage: "https://cdn/marta.jpg",
  agentPhone: "+34 611 22 33 44",
  agentEmail: "marta.gil@gmail.com",
  propertyType: "piso",
  listingType: "Sale",
  squareMeter: 92,
  hasElevator: true,
  hasGarage: true,
  garageNumber: "17",
  isFurnished: false,
};

console.log("fichaPublica: solo zona, precio oculto, tarjeta de la oficina");
{
  const { caracteristicas, cliente } = fichaPublica(
    toPublicDetailLocation(anuncio),
    { hayOficina: true },
  );
  // El título va aparte: está en la URL de la ficha (buildPropertySlug).
  const todo = json({ caracteristicas, cliente: { ...cliente, titulo: null } });

  ok(
    json(Object.keys(cliente).sort()) ===
      json(["agente", "listingId", "precio", "propertyId", "titulo"]),
    "la barra recibe cinco campos y nada más",
  );
  ok(cliente.listingId === "4512" && cliente.propertyId === "9031", "ids en texto");
  ok(cliente.titulo === "Piso en Calle Ancha 14", "el título guardado (ya va en la URL)");
  ok(cliente.precio === null, "sin precio cuando la agencia lo oculta");
  ok(cliente.agente === null, "sin datos del agente si sale la oficina");
  for (const fuera of [
    "Calle Ancha", "24003", "3º B", "42.598765", "-5.567123",
    "9872023VH5797S0001WX", "245000", "611 22 33 44", "marta.gil@gmail.com",
    "Marta Gil", "ID-88", "u_7f3",
  ]) {
    ok(!todo.includes(fuera), `no viaja «${fuera}»`);
  }
  for (const fuera of [
    "street", "postalCode", "addressDetails", "latitude", "longitude",
    "cadastralReference", "viewCount", "inquiryCount", "price", "hidePrice",
    "agentPhone", "agentEmail", "isActive", "fcLocationVisibility",
  ]) {
    ok(!(fuera in caracteristicas), `«Características» no recibe ${fuera}`);
  }
  ok(
    caracteristicas.propertyType === "piso" && caracteristicas.squareMeter === 92,
    "«Características» recibe lo que pinta",
  );
  ok(caracteristicas.garageNumber === "17", "el número de plaza sí: se pinta como «Número»");
  ok(caracteristicas.isFurnished === false, "un false se conserva");
}

console.log("fichaPublica: tarjeta del agente");
{
  const { cliente } = fichaPublica(
    { ...anuncio, useAgentPhone: true, hidePrice: false, title: "  " },
    { hayOficina: true },
  );
  ok(cliente.agente?.phone === "+34 611 22 33 44", "con «Agente» en Vesta, su móvil");
  ok(cliente.agente?.email === "marta.gil@gmail.com", "y su correo");
  ok(cliente.precio === "245000.00", "precio visible, precio en la consulta");
  ok(cliente.titulo === null, "sin título, null (la consulta pone «Propiedad sin título»)");

  const sinOficina = fichaPublica(anuncio, { hayOficina: false });
  ok(
    sinOficina.cliente.agente?.name === "Marta Gil",
    "sin datos de la oficina, la tarjeta del agente (como antes)",
  );
}

console.log("CAMPOS_CARACTERISTICAS cubre lo que lee characteristics-data");
{
  const fuente = readFileSync(
    new URL("../components/property/characteristics-data.ts", import.meta.url),
    "utf8",
  );
  const leidos = new Set(
    [...fuente.matchAll(/\bproperty\??\.([a-zA-Z_]+)/g)].map((m) => m[1]!),
  );
  const lista = new Set<string>(CAMPOS_CARACTERISTICAS);
  const faltan = [...leidos].filter((c) => !lista.has(c));
  ok(faltan.length === 0, `faltan en la lista: ${faltan.join(", ") || "ninguno"}`);
  ok(leidos.size > 50, `se leyeron ${leidos.size} campos del fichero`);
}

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\nficha-publica: todo bien");
