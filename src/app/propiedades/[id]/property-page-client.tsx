"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ShareButton } from "~/components/property/share-button";
import { submitPropertyInquiry } from "~/server/actions/property-inquiry";
import type { PropertyInquiryData } from "~/server/actions/property-inquiry";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { PrivacyNotice } from "~/components/privacy-notice";
import { trackLeadCreated } from "~/lib/track-lead";
import { useAspectoV1 } from "~/components/header-style-context";
import type { FichaCliente } from "~/lib/ficha-publica";
import {
  AgencyCard,
  AgentCard,
  OfficeCard,
  type AgencyContact,
} from "~/components/property/tarjetas-contacto";

interface PropertyPageClientProps {
  /** Solo lo que pinta esta barra (~/lib/ficha-publica), no el anuncio. */
  ficha: FichaCliente;
  agency?: AgencyContact | null;
  /** Invert the agency logo (white logos need to render dark on the light card). */
  logoInvertOnLight?: boolean;
  /**
   * `features_props.fichaTarjetaOficina`: la tarjeta de la v1. Logo o inicial,
   * nombre, teléfono y correo, debajo de los botones y también con el
   * formulario abierto. Sin ella, la de hoy (solo logo y datos, encima).
   */
  tarjetaOficina?: boolean;
}

export function PropertyPageClient({
  ficha,
  agency,
  logoInvertOnLight,
  tarjetaOficina = false,
}: PropertyPageClientProps) {
  // v1 look (`aspectoV1`): the form's title in bold, no kicker.
  const v1 = useAspectoV1();
  const [showContactForm, setShowContactForm] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    message: "Hola, estoy interesado en esta propiedad. Me gustaría recibir más información.",
    honeypot: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleContactForm = () => {
    setShowContactForm(!showContactForm);
    // Reset states when toggling
    if (!showContactForm) {
      setIsSubmitted(false);
      setError(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData: PropertyInquiryData = {
        name: formState.name,
        email: formState.email || undefined,
        phone: formState.phone,
        message: formState.message,
        propertyId: ficha.listingId,
        propertyTitle: ficha.titulo ?? "Propiedad sin título",
        propertyPrice: ficha.precio ?? undefined,
        honeypot: formState.honeypot || undefined,
      };

      console.log("[Property Inquiry] Submitting form data", {
        ...formData,
        phone: formData.phone ? "[REDACTED]" : undefined,
        email: formData.email ? formData.email.substring(0, 3) + "***" : undefined,
      });

      const result = await submitPropertyInquiry(formData);

      console.log("[Property Inquiry] Server response", {
        success: result.success,
        hasError: !!result.error,
        errorMessage: result.error,
      });

      if (result.success) {
        trackLeadCreated();
        setIsSubmitted(true);
        setFormState({
          name: "",
          email: "",
          phone: "",
          message: "Hola, estoy interesado en esta propiedad. Me gustaría recibir más información.",
          honeypot: "",
        });
      } else {
        setError(result.error || "Error al enviar la consulta");
      }
    } catch (err) {
      console.error("[Property Inquiry] Exception during submission:", err);
      if (err instanceof Error) {
        console.error("[Property Inquiry] Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
      }
      setError("Error al enviar la consulta. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vesta's "Cuenta" vs "Agente" toggle, decided in fichaPublica: no agent
  // data means the listing publishes the agency's contact.
  const tarjeta = ficha.agente ? (
    <AgentCard agente={ficha.agente} />
  ) : agency ? (
    tarjetaOficina ? (
      <OfficeCard agency={agency} logoInvertOnLight={logoInvertOnLight} />
    ) : (
      <AgencyCard agency={agency} logoInvertOnLight={logoInvertOnLight} />
    )
  ) : null;

  return (
    <div
      id="contacto"
      className={
        // v1: on mobile the contact card comes after the description.
        v1
          ? "scroll-mt-28 space-y-6 lg:sticky lg:top-28 lg:self-start"
          : "order-1 scroll-mt-28 space-y-6 lg:order-2 lg:sticky lg:top-28 lg:self-start"
      }
    >
      {/* Acciones */}
      {!showContactForm && (
        <>
          {!tarjetaOficina && tarjeta}
          <div className="flex gap-2">
            <Button size="pill" className="flex-1" onClick={toggleContactForm}>
              Contactar
            </Button>
            <ShareButton />
          </div>
        </>
      )}

      {/* Formulario de contacto - Conditional rendering */}
      {showContactForm && (
        <div className="relative rounded-xl border border-border/60 bg-card p-7">
          <button
            onClick={toggleContactForm}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Cerrar formulario"
          >
            <X className="h-5 w-5" />
          </button>
          {!v1 && (
            <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              Contactar
            </span>
          )}
          <h3 className={v1 ? "mb-4 pr-12 text-lg font-bold" : "mb-6 mt-2 pr-12 text-xl font-medium tracking-tight text-foreground"}>
            ¿Interesado en esta propiedad?
          </h3>

          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-green-100 bg-green-50">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="mb-3 text-xl font-medium tracking-tight text-foreground">
                Consulta Enviada
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Gracias por tu interés. Hemos recibido tu consulta y nos pondremos en contacto contigo pronto.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot field — hidden from real users, bots auto-fill it */}
              <div
                aria-hidden="true"
                style={{ position: "absolute", left: "-9999px", opacity: 0 }}
              >
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  name="honeypot"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formState.honeypot}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
                >
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className="h-11 w-full rounded-md border border-input bg-background px-4 text-base transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:text-sm"
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
                >
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formState.phone}
                  onChange={handleChange}
                  className="h-11 w-full rounded-md border border-input bg-background px-4 text-base transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:text-sm"
                  placeholder="Tu teléfono"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
                >
                  Email <span className="normal-case text-muted-foreground/70">(opcional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="h-11 w-full rounded-md border border-input bg-background px-4 text-base transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:text-sm"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
                >
                  Mensaje
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-4 py-3 text-base transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:text-sm"
                  placeholder="Me interesa esta propiedad..."
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" size="pill" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Consulta"}
              </Button>
              <PrivacyNotice />
            </form>
          )}
        </div>
      )}

      {/* Como la v1: debajo, con el formulario abierto o cerrado. */}
      {tarjetaOficina && tarjeta}
    </div>
  );
}