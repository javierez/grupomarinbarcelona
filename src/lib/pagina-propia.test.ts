// Las páginas propias: qué direcciones no pueden tener (las de la plantilla y
// las búsquedas), qué se pinta de lo guardado y qué búsqueda es un bloque de
// inmuebles. Sin framework: afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/lib/pagina-propia.test.ts
import { readdirSync, readFileSync } from "node:fs";
import {
  SLUGS_RESERVADOS,
  busquedaDelBloque,
  esMuestra,
  esSlugReservado,
  paginasDeLaWeb,
} from "./pagina-propia";

let failed = 0;

function ok(actual: unknown, expected: unknown, what: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.log(`  ✗ ${what}: esperado ${e}, recibido ${a}`);
}

console.log("\nSLUGS_RESERVADOS = las carpetas de src/app y las redirecciones de next.config.js");
const carpetas = readdirSync(new URL("../app", import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("[") && !d.name.startsWith("(") && !d.name.startsWith("_"))
  .map((d) => d.name);
const redirecciones = [
  ...readFileSync(new URL("../../next.config.js", import.meta.url), "utf8").matchAll(
    /source:\s*"\/([a-z0-9-]+)[/"]/g,
  ),
].map((m) => m[1]!);
const deLaPlantilla = [...new Set([...carpetas, ...redirecciones])].sort();
ok([...SLUGS_RESERVADOS].sort(), deLaPlantilla, "la misma lista (una ruta nueva va aquí y en el CRM)");

console.log("\nesSlugReservado");
ok(esSlugReservado("contacto"), true, "una ruta de la plantilla");
ok(esSlugReservado("noticias"), true, "una redirección");
ok(esSlugReservado("venta-pisos"), true, "venta-…");
ok(esSlugReservado("venta"), true, "«venta» a secas es una búsqueda");
ok(esSlugReservado("alquilar"), true, "«alquilar» también (alquil…)");
ok(esSlugReservado("todo-pisos"), true, "todo-…");
ok(esSlugReservado("reformas-integrales"), false, "una página nueva");
ok(esSlugReservado("ventajas"), false, "«ventajas» no es una búsqueda");
ok(esMuestra("_muestra-2"), true, "_muestra-2");
ok(esMuestra("_muestra-4"), false, "solo tres muestras");

console.log("\npaginasDeLaWeb");
const texto = { tipo: "texto", texto: "Hola **mundo**" };
ok(paginasDeLaWeb(undefined), [], "sin campo, sin páginas");
ok(
  paginasDeLaWeb([{ slug: "reformas-integrales", titulo: "Reformas", bloques: [texto] }]).map((p) => p.slug),
  ["reformas-integrales"],
  "una buena",
);
ok(
  paginasDeLaWeb([
    { slug: "contacto", titulo: "Choca", bloques: [texto] },
    { slug: "Mayúsculas", titulo: "Mal", bloques: [texto] },
    { slug: "alquilar", titulo: "Buscador", bloques: [texto] },
    { slug: "_muestra-1", titulo: "Muestra", bloques: [texto] },
    { slug: "_muestra-9", titulo: "Muestra de más", bloques: [texto] },
    { slug: "sin-titulo", bloques: [texto] },
    { slug: "a".repeat(61), titulo: "Larga", bloques: [texto] },
  ]).map((p) => p.slug),
  ["_muestra-1"],
  "fuera las reservadas, las mal escritas, la de más de 60 y la que no tiene título; la muestra se queda",
);
ok(
  paginasDeLaWeb([
    { slug: "duplicada", titulo: "Primera", bloques: [texto] },
    { slug: "duplicada", titulo: "Segunda", bloques: [texto] },
  ]).map((p) => p.titulo),
  ["Primera"],
  "dirección repetida: la primera",
);
const [conRoto] = paginasDeLaWeb([
  {
    slug: "con-un-bloque-roto",
    titulo: "Con uno roto",
    bloques: [
      { tipo: "galeria", imagenes: ["http://inseguro.es/a.jpg"] },
      { tipo: "desconocido" },
      { tipo: "formulario", modo: "contacto" },
    ],
  },
]);
ok(conRoto?.bloques.map((b) => b.tipo), ["formulario"], "un bloque roto se cae solo y la página sigue");
ok(
  paginasDeLaWeb([{ slug: "todo-roto", titulo: "Nada", bloques: [{ tipo: "galeria", imagenes: [] }] }]),
  [],
  "sin un bloque bueno, sin página",
);
ok(
  paginasDeLaWeb(
    Array.from({ length: 22 }, (_, i) => ({ slug: `p${i}`, titulo: `P${i}`, bloques: [texto] })),
  ).length,
  20,
  "como mucho veinte",
);

console.log("\nbusquedaDelBloque");
ok(
  busquedaDelBloque({ tipo: "inmuebles", tipos: ["pisos", "casas"], ciudad: "Gijón", precioMax: 300000 }),
  {
    href: "/venta-casas-pisos/en-gijon/con-precio-hasta_300000",
    limite: 6,
    filtros: {
      status: "for-sale",
      propertyType: ["casa", "piso"],
      cities: ["gijon"],
      location: "gijon",
      maxPrice: 300000,
    },
  },
  "venta de pisos y casas en Gijón hasta 300.000, seis por defecto",
);
ok(
  busquedaDelBloque({ tipo: "inmuebles", operacion: "alquiler", tipos: ["naves-industriales"], limite: 3 }),
  {
    href: "/alquiler-naves-industriales/todas-ubicaciones",
    limite: 3,
    filtros: { status: "for-rent", propertyType: ["industrial"] },
  },
  "alquiler de naves, tres",
);
ok(
  busquedaDelBloque({ tipo: "inmuebles" }).href,
  "/venta-propiedades/todas-ubicaciones",
  "sin nada, todo lo que está en venta",
);

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
