/**
 * Las líneas de texto visible que cambian entre dos páginas, en orden: «-»
 * solo en la primera, «+» solo en la segunda. Para comparar la vista previa
 * del CRM con la web publicada (`scripts/comparar-vista-previa.ts`). Espacios
 * y líneas vacías no cuentan; mayúsculas sí, porque se ven.
 */
export function diferenciasDeTexto(a: string, b: string): string[] {
  const la = lineas(a);
  const lb = lineas(b);
  // Subsecuencia común más larga, línea a línea (una portada son ~200).
  const n = la.length;
  const m = lb.length;
  const t: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      t[i]![j] = la[i] === lb[j] ? t[i + 1]![j + 1]! + 1 : Math.max(t[i + 1]![j]!, t[i]![j + 1]!);
    }
  }
  const fuera: string[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (la[i] === lb[j]) {
      i++;
      j++;
    } else if (t[i + 1]![j]! >= t[i]![j + 1]!) {
      fuera.push(`- ${la[i++]}`);
    } else {
      fuera.push(`+ ${lb[j++]}`);
    }
  }
  while (i < n) fuera.push(`- ${la[i++]}`);
  while (j < m) fuera.push(`+ ${lb[j++]}`);
  return fuera;
}

function lineas(texto: string): string[] {
  return texto
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l !== "");
}
