import { ContactSection } from "~/components/contact-section";
import { PropertyListingForm } from "~/components/property/property-listing-form";
import { BetterPlaceRatings } from "~/components/vender/betterplace-ratings";
import { VenderLeadForm } from "~/components/vender/vender-lead-form";
import {
  ACCOUNT_155_BETTERPLACE_RATINGS_URL,
  isAccount155,
} from "~/lib/account-overrides/155";
import type { BloqueDe } from "~/lib/pagina-propia";
import type { FeaturesProps } from "~/server/queries/website-config";
import { TituloDeBloque } from "./piezas";

/**
 * Los formularios de la web, tal cual, así que el contacto llega al CRM igual
 * que desde /contacto y /vender:
 * - contacto → el de /contacto, con la ficha de la oficina.
 * - vender → lo que enseña /vender en esta cuenta: el valorador de GO4 (155),
 *   el corto (`venderFormulario: "corto"`, el propietario va a Captaciones) o
 *   el de tres pasos.
 * - valorar → el valorador de GO4; las demás no tienen valorador en la web,
 *   así que piden la valoración con el formulario corto.
 */
export function Formulario({
  bloque,
  venderFormulario,
}: {
  bloque: BloqueDe<"formulario">;
  venderFormulario: FeaturesProps["venderFormulario"];
}) {
  if (bloque.modo === "contacto") return <ContactSection titulo={bloque.titulo} />;

  if (isAccount155()) {
    return (
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl">
          {bloque.titulo && <TituloDeBloque centrado>{bloque.titulo}</TituloDeBloque>}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-background">
            <BetterPlaceRatings url={ACCOUNT_155_BETTERPLACE_RATINGS_URL} height={460} />
          </div>
        </div>
      </section>
    );
  }

  if (bloque.modo === "vender" && venderFormulario !== "corto") {
    return (
      <section className="py-16 sm:py-20">
        <div className="container mx-auto max-w-4xl">
          <TituloDeBloque centrado>{bloque.titulo ?? "Publica tu inmueble"}</TituloDeBloque>
          <PropertyListingForm />
        </div>
      </section>
    );
  }

  return (
    <section className="container py-16 sm:py-20">
      <VenderLeadForm
        titulo={bloque.titulo ?? (bloque.modo === "valorar" ? "Te valoramos tu inmueble" : "Vende tu propiedad con nosotros")}
      />
    </section>
  );
}
