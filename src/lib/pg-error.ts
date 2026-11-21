/**
 * La vista o tabla todavía no existe (42P01, migración sin aplicar) o este
 * rol no la puede leer (42501). Mira también el error envuelto en `cause`.
 */
export function faltaLaVista(error: unknown): boolean {
  const codigo = (e: unknown) => (e as { code?: unknown } | null)?.code;
  const c = codigo(error) ?? codigo((error as { cause?: unknown } | null)?.cause);
  return c === "42P01" || c === "42501";
}
