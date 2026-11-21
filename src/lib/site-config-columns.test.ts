// El borrador encima de lo publicado (contrato web-por-chat §1).
// Sin framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/site-config-columns.test.ts
import {
  SITE_CONFIG_KEYS,
  mergeDraft,
  siteConfigTag,
  type SiteConfigRow,
} from "./site-config-columns";

let failed = 0;

function eq(actual: unknown, expected: unknown, what: string): void {
  if (actual === expected) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}\n      esperado: ${String(expected)}\n      obtenido: ${String(actual)}`);
}

const publicada = Object.fromEntries(
  SITE_CONFIG_KEYS.map((k) => [k, `{"de":"${k}"}`]),
) as SiteConfigRow;

console.log("columnas");
eq(SITE_CONFIG_KEYS.length, 23, "23 columnas editables");
eq(siteConfigTag("265"), "web-265", "etiqueta de revalidar");

console.log("mergeDraft");
const borrador = mergeDraft(publicada, {
  color_props: '{"primaryColor":"#111111"}',
  hero_props: { title: "Hola" },
  logo: null,
  vercel_project: "otro-proyecto",
  account_id: 999,
});
eq(borrador?.colorProps, '{"primaryColor":"#111111"}', "texto tal cual");
eq(borrador?.heroProps, '{"title":"Hola"}', "jsonb vuelve a texto");
eq(borrador?.logo, null, "null del borrador gana");
eq(borrador?.fontProps, '{"de":"fontProps"}', "lo que no trae se queda");
eq((borrador as Record<string, unknown>).vercelProject, undefined, "vercel_project no entra");
eq((borrador as Record<string, unknown>).accountId, undefined, "account_id no entra");
eq(publicada.colorProps, '{"de":"colorProps"}', "no toca la fila publicada");

const sinFila = mergeDraft(null, { font_props: '{"sansFamily":"poppins"}' });
eq(sinFila?.fontProps, '{"sansFamily":"poppins"}', "sin fila publicada: solo el borrador");
eq(sinFila?.colorProps, null, "sin fila publicada: el resto null");

eq(mergeDraft(publicada, null), publicada, "snapshot null: la publicada");
eq(mergeDraft(publicada, ["x"]), publicada, "snapshot raro: la publicada");
eq(mergeDraft(null, "{}"), null, "nada de nada: null");

if (failed > 0) {
  console.error(`\n${failed} fallo(s)`);
  process.exit(1);
}
console.log("\nTodo bien");
