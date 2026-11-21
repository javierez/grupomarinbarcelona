// Los ids que el navegador manda al feed. Sin framework: afirma, imprime un
// resumen y sale != 0.
//
//   pnpm tsx src/lib/feed-ids.test.ts
import { FEED_IDS_MAX, feedIds } from "./feed-ids";

let failed = 0;

function ok(cond: boolean, what: string): void {
  if (cond) {
    console.log(`  ✓ ${what}`);
    return;
  }
  failed++;
  console.error(`  ✗ ${what}`);
}

const same = (a: bigint[], b: bigint[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

console.log("feedIds");
ok(same(feedIds(["12", "7"]), [12n, 7n]), "ids en texto → bigint, en orden");
ok(same(feedIds(["12", "12", "7"]), [12n, 7n]), "sin repetir");
ok(
  same(feedIds(["abc", "", "-3", "0", "1.5", "1e3", " 4", 5, null, "9"]), [9n]),
  "fuera lo que no es un entero positivo en texto",
);
ok(same(feedIds("12"), []), "una cadena suelta no es una lista");
ok(same(feedIds(undefined), []), "sin nada, nada");
ok(feedIds(["99999999999999999999"]).length === 0, "fuera lo que no cabe en un bigint de la base");
const many = Array.from({ length: 100 }, (_, i) => String(i + 1));
ok(feedIds(many).length === FEED_IDS_MAX, `como mucho ${FEED_IDS_MAX}`);

console.log(failed === 0 ? "\nTodo bien." : `\n${failed} fallo(s).`);
process.exit(failed === 0 ? 0 : 1);
