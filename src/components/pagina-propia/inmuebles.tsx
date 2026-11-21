import Link from "next/link";
import { Button } from "~/components/ui/button";
import { PropertyHeader } from "~/components/propertygrid/PropertyHeader";
import { PropertyGridContent } from "~/components/propertygrid/PropertyGridContent";
import { busquedaDelBloque, type BloqueDe } from "~/lib/pagina-propia";
import { searchListings } from "~/server/queries/listings";
import { getWatermarkConfig } from "~/server/queries/watermark";
import { getPropertiesConfig, getVideoFeatures } from "~/server/queries/website-config";
import { AvisoDeBorrador } from "./piezas";

/**
 * Los pisos de una búsqueda, con las tarjetas de «Propiedades destacadas» y
 * un «Ver todas» que abre esa misma búsqueda en la web. Sin resultados no se
 * pinta (en el borrador, un aviso dice por qué).
 */
export async function Inmuebles({
  bloque,
  borrador,
}: {
  bloque: BloqueDe<"inmuebles">;
  borrador: boolean;
}) {
  const { href, limite, filtros } = busquedaDelBloque(bloque);
  const [listings, config, watermark, video] = await Promise.all([
    searchListings(filtros, limite),
    getPropertiesConfig(),
    getWatermarkConfig(),
    getVideoFeatures(),
  ]);
  if (listings.length === 0 && !borrador) return null;
  const titulo = bloque.titulo ?? "Nuestros inmuebles";

  return (
    <section className="py-16 sm:py-20">
      <div className="container">
        <PropertyHeader title={titulo} subtitle="" vesta={{ titulo: "bloque.titulo" }} />
        {listings.length === 0 ? (
          <AvisoDeBorrador>
            Ahora mismo no hay inmuebles con estos filtros: en la web publicada este bloque no se ve.
          </AvisoDeBorrador>
        ) : (
          <>
            <PropertyGridContent
              listings={listings}
              watermarkEnabled={watermark.enabled && !!watermark.logoUrl}
              showDescription={config.showDescription !== false}
              showReference={config.showReference !== false}
              cardDisplay={config.cardDisplay}
              video={{ badge: video.cardBadge, preview: video.cardPreview }}
            />
            <div className="mt-12 flex justify-center">
              <Button size="pill" asChild>
                <Link href={href}>{config.buttonText}</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
