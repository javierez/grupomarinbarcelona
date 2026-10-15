// Los idiomas del selector de la web y la descripción traducida de la ficha.
// Sin framework: afirma, imprime un resumen y sale != 0, como el resto de tests.
//
//   pnpm tsx src/lib/site-languages.test.ts
import {
  gtCode,
  inSyncTranslations,
  parseStoredLang,
  siteLanguagesFor,
} from "./site-languages";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

console.log("siteLanguagesFor");
ok(
  same(siteLanguagesFor({ accountLanguages: undefined, switcherFlag: false }), []),
  "sin idiomas ni interruptor no hay selector",
);
ok(
  same(siteLanguagesFor({ accountLanguages: [], switcherFlag: true }), ["en"]),
  "el interruptor de Kit Digital da inglés",
);
ok(
  same(
    siteLanguagesFor({ accountLanguages: ["de", "en", "fr"], switcherFlag: false }),
    ["en", "fr", "de"],
  ),
  "los idiomas de la agencia salen en el orden del catálogo",
);
ok(
  same(
    siteLanguagesFor({ accountLanguages: ["en", "en", "es", "xx", 7], switcherFlag: true }),
    ["en"],
  ),
  "repetidos, castellano, desconocidos y basura no cuentan",
);
ok(
  same(siteLanguagesFor({ accountLanguages: "en", switcherFlag: false }), []),
  "una cadena en vez de una lista no cuenta",
);

console.log("parseStoredLang");
const offered = ["en", "zh"];
ok(parseStoredLang(null, offered) === "es", "sin nada guardado, castellano");
ok(parseStoredLang("{mal", offered) === "es", "un JSON roto, castellano");
ok(parseStoredLang('{"tgtLang":"en"}', offered) === "en", "inglés guardado");
ok(
  parseStoredLang('{"tgtLang":"zh-CN"}', offered) === "zh",
  "el código de GTranslate vuelve al nuestro",
);
ok(
  parseStoredLang('{"tgtLang":"fr"}', offered) === "es",
  "un idioma que la web no ofrece, castellano",
);
ok(parseStoredLang('{"tgtLang":7}', offered) === "es", "un valor raro, castellano");
ok(gtCode("zh") === "zh-CN" && gtCode("fr") === "fr", "código para GTranslate");

console.log("inSyncTranslations");
const hash = "abc";
ok(
  same(
    inSyncTranslations(
      {
        en: { text: " Sunny flat with a view of the cathedral ", hash },
        fr: { text: "Appartement ensoleillé", hash: "viejo" },
        de: { text: "   ", hash },
        xx: { text: "nada", hash },
      },
      hash,
    ),
    { en: "Sunny flat with a view of the cathedral" },
  ),
  "solo la traducción hecha de la descripción de hoy, sin blancos",
);
ok(same(inSyncTranslations(null, hash), {}), "sin traducciones, vacío");
ok(same(inSyncTranslations("texto", hash), {}), "basura, vacío");
ok(
  same(inSyncTranslations({ en: null, fr: { text: 3, hash } }, hash), {}),
  "entradas rotas, vacío",
);

console.log(failed === 0 ? "\nTodo bien" : `\n${failed} fallos`);
process.exit(failed === 0 ? 0 : 1);
