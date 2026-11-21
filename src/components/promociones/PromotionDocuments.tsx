import { FileText } from "lucide-react";
import {
  promotionDocumentLabel,
  sortPromotionDocuments,
  type PromotionDocument,
} from "~/lib/promotion-documents";

interface PromotionDocumentsProps {
  documents: PromotionDocument[] | null | undefined;
  /**
   * Nombre de la promoción. Se enseña en la ficha de una unidad, donde el
   * visitante necesita saber que el PDF es del edificio y no de ese piso; en
   * la ficha de la promoción sobra y se omite.
   */
  promotionName?: string | null;
}

/**
 * Bloque de descarga de los PDFs de la promoción (memoria de calidades,
 * dossier informativo).
 *
 * Se pinta tanto en la página de la promoción como en la de cada unidad
 * enlazada: la memoria describe el edificio entero, así que la agencia la sube
 * una vez y las N unidades la enseñan. Sin documentos no hay bloque — nada de
 * secciones vacías.
 */
export function PromotionDocuments({
  documents,
  promotionName,
}: PromotionDocumentsProps) {
  const docs = sortPromotionDocuments(documents);
  if (docs.length === 0) return null;

  return (
    <div>
      <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Documentación
      </span>
      <h2 className="mb-5 text-2xl font-medium tracking-tight">
        Memoria y dossier
      </h2>
      <ul className="space-y-3" role="list">
        {docs.map((doc) => (
          <li key={doc.url}>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex max-w-md items-center gap-4 rounded-xl border border-border/60 p-4 transition-colors hover:border-foreground/40"
            >
              <FileText className="h-6 w-6 flex-shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {doc.filename}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {promotionDocumentLabel(doc.tag)}
                </span>
                {!!promotionName && (
                  <span className="block text-xs text-muted-foreground">
                    Promoción {promotionName}
                  </span>
                )}
              </span>
              <span className="flex-shrink-0 text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
                Descargar
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
