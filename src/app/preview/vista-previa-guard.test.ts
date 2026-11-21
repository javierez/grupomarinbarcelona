// La vista previa de «Mi web» es la portada de la agencia, no una copia.
//
// El 17-nov-2026 Sergio (Muñoz Espasande) vio en el editor otra portada que en
// su web, y no era solo él: 14 de 17 agencias. `preview-home.tsx` tenía su
// propia lista de secciones y sus propias versiones de cada una, y se quedó sin
// la portada editorial, sin la v3, sin «Recorridos en vídeo» y con tarjetas
// que la web tenía apagadas. Ahora las dos pintan `Portada`
// (`src/components/portada.tsx`), y cada sección en directo pinta el mismo
// componente que la web.
//
// Esto falla si vuelve una copia: si la portada o la vista previa dejan de
// pintar `Portada`, si la vista previa decide por su cuenta si una sección
// sale, o si un fichero de la vista previa importa una pieza interna de una
// sección (una cabecera, una tarjeta, el hero de siempre) en lugar del
// componente que también pinta la web. Lo que esto no ve, lo ve
// `scripts/comparar-vista-previa.ts` contra las webs publicadas.
//
// Sin framework: afirma, imprime un resumen y sale != 0.
//
//   pnpm tsx src/app/preview/vista-previa-guard.test.ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SECTION_ANCHORS } from "./[section]/preview-sections";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const DIR = join(import.meta.dirname, "[section]");
const leer = (f: string) => readFileSync(f, "utf8");
const sinComentarios = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

console.log("Una sola portada");
const pagina = sinComentarios(leer(join(import.meta.dirname, "..", "page.tsx")));
const previa = sinComentarios(leer(join(DIR, "preview-home.tsx")));
ok(/<Portada\s*\/>/.test(pagina), "la web (app/page.tsx) pinta <Portada />");
ok(/<Portada[\s\S]*accountId=\{accountId\}[\s\S]*previa=/.test(previa), "la vista previa pinta <Portada accountId previa>");
ok(
  !/features\.sections|sections\?\./.test(previa),
  "la vista previa no decide si una sección sale (eso es de Portada)",
);

console.log("\nLas anclas del editor existen en Portada");
const portada = leer(join(import.meta.dirname, "..", "..", "components", "portada.tsx"));
const piezas = [...(/export type PiezaEnDirecto =([^;]+);/.exec(portada)?.[1] ?? "").matchAll(/"([\w-]+)"/g)].map(
  (m) => m[1]!,
);
const anclas = new Set([...piezas.map((p) => `preview-${p}`), "preview-social"]);
for (const ancla of new Set(Object.values(SECTION_ANCHORS))) {
  ok(anclas.has(ancla), `${ancla} la pinta Portada`);
}

// Lo que un fichero de la vista previa puede importar de la web: el componente
// que pinta TAMBIÉN la web para esa sección, nunca sus piezas de dentro. Uno
// nuevo entra aquí con su porqué, después de que la web lo pinte igual.
const PERMITIDOS: Record<string, string> = {
  "~/components/portada": "la portada entera",
  "~/components/hero-por-estilo": "el hero, como hero.tsx",
  "~/components/about/sobre-nosotros": "Sobre nosotros, como about-section.tsx",
  "~/components/propertygrid/destacados": "Destacados, como property-grid.tsx",
  "~/components/testimonials/opiniones": "Opiniones, como TestimonialsSection",
  "~/components/testimonials/TestimonialsSection": "aOpiniones: las filas como las pinta la web",
  "~/components/contact/contacto": "Contacto, como contact-section.tsx",
  "~/components/category-panel": "las tarjetas, como Portada",
  "~/components/banner-carousel": "el banner, como promo-banner.tsx",
  "~/components/social-family-view": "la familia social, como social-family-section.tsx",
  "~/components/social-family-section": "familiaSocial: las redes y el interruptor de la web",
  "~/components/footer": "el pie, el mismo componente con el texto en directo",
  "~/components/property-search-wrapper": "el buscador completo del hero, como hero.tsx",
  "~/components/ui/social-links": "solo el tipo SocialLink",
  "~/app/faqs/faqs-content": "la página /faqs, la misma",
  "~/app/servicios/servicios-content": "la página /servicios, la misma",
  "~/app/fonts": "las fuentes de la web",
  // El blog no es la portada: su vista previa pinta la cabecera y la lista del
  // blog con los textos en directo. Si /blog gana una sección, aquí no sale.
  "~/components/blog/blog-hero": "la cabecera de /blog",
  "~/components/blog/post-list": "la lista de /blog",
};

console.log("\nLa vista previa no importa piezas internas");
for (const f of readdirSync(DIR).filter((n) => /\.tsx?$/.test(n))) {
  const imports = [...leer(join(DIR, f)).matchAll(/from\s+"(~\/(?:components|app)\/[^"]+)"/g)].map((m) => m[1]!);
  const fuera = imports.filter((i) => !(i in PERMITIDOS));
  ok(fuera.length === 0, fuera.length ? `${f} importa ${fuera.join(", ")}` : f);
}

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
