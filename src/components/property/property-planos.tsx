interface PlanoItem {
  id: string;
  url: string;
}

interface PropertyPlanosProps {
  planos: PlanoItem[];
}

/** A plano whose URL points at a PDF gets embedded; anything else is an image. */
function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return url.toLowerCase().split("?")[0]?.endsWith(".pdf") ?? false;
  }
}

/**
 * Planos (floor plans) section for the property detail page. PDF planos are
 * embedded in a small iframe (with an open-in-new-tab link); image planos show
 * a small preview that opens full size, plus a download link.
 */
export function PropertyPlanos({ planos }: PropertyPlanosProps) {
  if (planos.length === 0) return null;

  return (
    <div>
      <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Documentación
      </span>
      <h2 className="mb-5 text-2xl font-medium tracking-tight">Planos</h2>
      <div className="space-y-4">
        {planos.map((plano) =>
          isPdfUrl(plano.url) ? (
            <div key={plano.id} className="space-y-2">
              <div className="h-64 w-full max-w-md overflow-hidden rounded-xl border border-border/60 sm:h-80">
                <iframe src={plano.url} title="Plano" className="h-full w-full" />
              </div>
              <a
                href={plano.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Abrir plano en otra pestaña (PDF)
              </a>
            </div>
          ) : (
            <div key={plano.id} className="space-y-2">
              <a
                href={plano.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-64 w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-white sm:h-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={plano.url}
                  alt="Plano"
                  className="h-full w-full object-contain"
                />
              </a>
              <a
                href={plano.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Descargar plano
              </a>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
