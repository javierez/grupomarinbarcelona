// Señalar desde «Mi web» (contrato web-por-chat §6.1): el mapa de claves, los
// mensajes y lo que se manda al CRM. Sin framework: afirma, imprime un resumen
// y sale != 0.
//
//   pnpm tsx src/lib/seleccion.test.ts
import { readdirSync, readFileSync } from "node:fs";
import { CLAVES, NOMBRE_DEL_BLOQUE, TIPOS_DE_ELEMENTO, definicionDe } from "./seleccion-claves";
import { elementoDeLasMarcas, imagenOriginal, ordenDeSeleccion, recortar, MAX_TEXTO } from "./seleccion";
import { SITE_CONFIG_COLUMNS } from "./site-config-columns";
import { esPadrePermitido } from "./vesta-origins";

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

console.log("\nEl mapa");
const columnas = new Set<string>(Object.values(SITE_CONFIG_COLUMNS));
for (const [clave, def] of Object.entries(CLAVES) as [string, Record<string, unknown>][]) {
  const fallos: string[] = [];
  if (typeof def.etiqueta !== "string" || !def.etiqueta) fallos.push("sin etiqueta");
  if (!(TIPOS_DE_ELEMENTO as readonly unknown[]).includes(def.tipo)) fallos.push(`tipo ${String(def.tipo)}`);
  const { conNombre } = def;
  if (conNombre !== undefined && (typeof conNombre !== "string" || !conNombre.includes("{nombre}"))) {
    fallos.push("conNombre sin {nombre}");
  }
  if (typeof def.campo === "string" && !columnas.has(def.campo.split(/[.[]/)[0]!)) fallos.push(`campo ${def.campo}`);
  if (fallos.length > 0) ok(fallos, [], clave);
}
ok(Object.keys(CLAVES).length > 50, true, "todas las claves con etiqueta, tipo y una columna de website_config");
ok(definicionDe("toString"), undefined, "lo heredado de Object no es una clave");

// Cada `data-vesta` de los componentes está en el mapa, y cada clave del mapa
// se usa en alguno: una que falta no se puede señalar; una que sobra, miente.
const fuentes = readdirSync(new URL("..", import.meta.url), { encoding: "utf8", recursive: true })
  .filter((f) => /\.(tsx|ts)$/.test(f) && !/(^|\/)seleccion(-claves)?(\.test)?\.ts$/.test(f))
  .map((f) => ({ f, texto: readFileSync(new URL(`../${f}`, import.meta.url), "utf8") }));
const usadas = new Map<string, string>();
for (const { f, texto } of fuentes) {
  for (const [, literal, expresion] of texto.matchAll(/data-vesta=(?:"([^"]*)"|\{([^}]*)\})/g)) {
    // En una expresión, lo que puede salir: no lo que se compara («=== "video"», «startsWith("extra:")»).
    const dentro =
      literal !== undefined
        ? [literal]
        : [...expresion!.matchAll(/"([^"]*)"/g)]
            .filter((m) => !/(?:[=!]==|\()\s*$/.test(expresion!.slice(0, m.index)))
            .map((m) => m[1]!);
    for (const clave of dentro) usadas.set(clave, f);
  }
}
const desconocidas = [...usadas].filter(([clave]) => !definicionDe(clave)).map(([c, f]) => `${c} (${f})`);
ok(desconocidas, [], "cada data-vesta de los componentes está en el mapa");
const todoElTexto = fuentes.map((x) => x.texto).join("\n");
const sinUsar = Object.keys(CLAVES).filter((c) => !todoElTexto.includes(`"${c}"`));
ok(sinUsar, [], "cada clave del mapa sale en algún componente");

const paginaPropia = readFileSync(new URL("../components/pagina-propia/pagina-propia.tsx", import.meta.url), "utf8");
const tiposDeBloque = [...paginaPropia.matchAll(/case "([a-z]+)":/g)].map((m) => m[1]!);
ok(
  tiposDeBloque.filter((t) => !(t in NOMBRE_DEL_BLOQUE)),
  [],
  `cada bloque de las páginas propias tiene nombre (${tiposDeBloque.length})`,
);

console.log("\nQuién manda");
ok(esPadrePermitido("https://vesta-crm.com", "https://www.inmobiliariavidal.es"), true, "el CRM");
ok(esPadrePermitido("https://www.vesta-crm.com", "https://www.inmobiliariavidal.es"), true, "un subdominio del CRM");
ok(esPadrePermitido("http://localhost:3000", "http://localhost:3005"), true, "el CRM en local");
ok(esPadrePermitido("http://localhost:3001", "https://www.inmobiliariavidal.es"), true, "el CRM en local, en el 3001");
ok(esPadrePermitido("http://localhost:3002", "https://www.inmobiliariavidal.es"), false, "otro puerto local no");
ok(esPadrePermitido("https://www.inmobiliariavidal.es", "https://www.inmobiliariavidal.es"), true, "la propia web");
ok(esPadrePermitido("https://otra-web.es", "https://www.inmobiliariavidal.es"), false, "otra web no");
ok(esPadrePermitido("https://vesta-crm.com.evil.es", "https://www.inmobiliariavidal.es"), false, "un dominio que lo imita no");
ok(esPadrePermitido("http://vesta-crm.com", "https://www.inmobiliariavidal.es"), false, "el CRM sin https no");
ok(esPadrePermitido("null", "null"), false, "un origen opaco no vale como «el propio»");

console.log("\nordenDeSeleccion");
ok(ordenDeSeleccion({ type: "vesta:seleccionar", activo: true }), true, "encender");
ok(ordenDeSeleccion({ type: "vesta:seleccionar", activo: false }), false, "apagar");
ok(ordenDeSeleccion({ type: "vesta:seleccionar", activo: "sí" }), null, "activo tiene que ser sí o no");
ok(ordenDeSeleccion({ type: "vesta:preview", section: "hero" }), null, "otro mensaje");
ok(ordenDeSeleccion("vesta:seleccionar"), null, "un texto suelto");

console.log("\nrecortar e imagenOriginal");
ok(recortar("  Pisos   en\n León  "), "Pisos en León", "espacios juntos");
ok(recortar("x".repeat(300))?.length, MAX_TEXTO, "como mucho 200");
ok(recortar("   "), undefined, "vacío");
const web = "https://www.inmobiliariavidal.es/propiedades/1";
const foto = "https://vesta-crm.s3.eu-west-3.amazonaws.com/accounts/265/a.jpg";
ok(imagenOriginal(`/_next/image?url=${encodeURIComponent(foto)}&w=1080&q=75`, web), foto, "la de next/image");
ok(imagenOriginal(`/api/image?url=${encodeURIComponent(foto)}`, web), foto, "la del proxy");
ok(imagenOriginal(foto, web), foto, "una foto normal, tal cual");
ok(imagenOriginal("/hero.jpg", web), "https://www.inmobiliariavidal.es/hero.jpg", "una relativa, entera");
ok(imagenOriginal(undefined, web), undefined, "sin foto");

console.log("\nelementoDeLasMarcas");
const ruta = "/";
ok(
  elementoDeLasMarcas([{ clave: "hero.titulo" }, { clave: "hero" }], { ruta, texto: "Tu casa en León" }),
  { clave: "hero.titulo", etiqueta: "Título de la portada", tipo: "texto", ruta, campo: "heroProps.title", texto: "Tu casa en León" },
  "el título de la portada",
);
ok(
  elementoDeLasMarcas([{ clave: "contacto.telefono", i: "1" }, { clave: "contacto" }], { ruta: "/contacto", texto: "987 000 000" })
    ?.campo,
  "contactProps.offices[1].phoneNumbers.main",
  "el teléfono de la segunda oficina",
);
ok(
  elementoDeLasMarcas([{ clave: "contacto.telefono" }], { ruta: "/contacto" })?.campo,
  "contactProps.offices",
  "sin oficina, la lista entera",
);
ok(
  elementoDeLasMarcas([{ clave: "tarjeta", i: "1", nombre: "Obra nueva" }, { clave: "tarjetas" }], { ruta: "/" }),
  { clave: "tarjeta", etiqueta: "Tarjeta «Obra nueva»", tipo: "enlace", ruta: "/", campo: "promoCardsProps[1]" },
  "una tarjeta propia de la portada",
);
ok(
  elementoDeLasMarcas([{ clave: "tarjeta", nombre: "Segunda mano" }], { ruta: "/" })?.campo,
  "promoCardsProps",
  "las tarjetas de siempre no tienen índice",
);
ok(
  elementoDeLasMarcas([{ clave: "pregunta", i: "2", nombre: "¿Cobráis por valorar?" }, { clave: "preguntas", i: "2" }], {
    ruta: "/faqs",
  }),
  {
    clave: "pregunta",
    etiqueta: "Pregunta «¿Cobráis por valorar?»",
    tipo: "texto",
    ruta: "/faqs",
    campo: "faqsProps[2].questions",
  },
  "una pregunta de /faqs, en su categoría",
);
ok(
  elementoDeLasMarcas([{ clave: "opinion", id: "42", nombre: "Marta Pérez" }, { clave: "opiniones" }], { ruta, texto: "Muy bien" }),
  { clave: "opinion", etiqueta: "Opinión de Marta Pérez", tipo: "opinion", ruta, texto: "Muy bien", testimonialId: "42" },
  "una opinión, con su autor y su id",
);
const foto1 = elementoDeLasMarcas([{ clave: "inmueble.foto" }, { clave: "inmueble.tarjeta", id: "1007" }, { clave: "destacados" }], {
  ruta,
  texto: "",
  imagen: foto,
});
ok([foto1?.clave, foto1?.tipo, foto1?.listingId, foto1?.imagen], ["inmueble.foto", "imagen", "1007", foto], "la foto de un piso trae su listingId");
ok(
  elementoDeLasMarcas([{ clave: "hero.titulo" }], { ruta, imagen: foto })?.imagen,
  undefined,
  "un texto no manda la foto",
);
ok(
  elementoDeLasMarcas([{ clave: "hero.boton-buscar" }], { ruta, texto: "Buscar pisos" })?.etiqueta,
  "Botón «Buscar pisos»",
  "un botón se llama por lo que pone",
);
ok(
  elementoDeLasMarcas([{ clave: "bloque.boton" }], { ruta, texto: "x".repeat(60) })?.etiqueta,
  "Botón del bloque",
  "un texto largo no es nombre de botón",
);
ok(
  elementoDeLasMarcas(
    [{ clave: "bloque.titulo" }, { clave: "bloque", i: "2", bloque: "galeria", pagina: "reformas" }],
    { ruta: "/reformas", texto: "Nuestras obras" },
  )?.bloque,
  { pagina: "reformas", indice: 2, tipo: "galeria" },
  "el título de un bloque dice en qué página y bloque está",
);
ok(
  elementoDeLasMarcas([{ clave: "bloque", i: "0", bloque: "preguntas", pagina: "vender" }], { ruta: "/vender" })?.etiqueta,
  "Preguntas frecuentes",
  "un bloque se llama por su tipo",
);
ok(
  elementoDeLasMarcas([{ clave: "no-existe" }, { clave: "pie" }], { ruta })?.clave,
  "pie",
  "una clave fuera del mapa se salta",
);
ok(elementoDeLasMarcas([{ clave: "no-existe" }], { ruta }), null, "sin ninguna del mapa, nada");
ok(
  elementoDeLasMarcas([{ clave: "pie.descripcion" }], { ruta, texto: "y ".repeat(200) })?.texto?.length,
  MAX_TEXTO,
  "el texto que se manda, como mucho 200",
);

console.log(failed === 0 ? "\nTodo bien.\n" : `\n${failed} fallo(s).\n`);
process.exit(failed === 0 ? 0 : 1);
