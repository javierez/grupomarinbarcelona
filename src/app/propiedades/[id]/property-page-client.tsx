"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ShareButton } from "~/components/property/share-button";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import { submitPropertyInquiry } from "~/server/actions/property-inquiry";
import type { PropertyInquiryData } from "~/server/actions/property-inquiry";
import { CheckCircle2, AlertCircle, X, Mail, Phone } from "lucide-react";

interface AgencyContact {
  name: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
}

interface PropertyPageClientProps {
  property: any;
  agency?: AgencyContact | null;
  /** Invert the agency logo (white logos need to render dark on the light card). */
  logoInvertOnLight?: boolean;
}

function getAgentInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function AgentCard({ property }: { property: any }) {
  const agentName = (property.agentName ?? "").trim();
  if (!agentName) return null;

  const agentImage = property.agentImage as string | null | undefined;
  const agentPhone = property.agentPhone as string | null | undefined;
  const agentEmail = property.agentEmail as string | null | undefined;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Agente
      </span>
      <div className="mt-4 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          {agentImage && <AvatarImage src={agentImage} alt={agentName} />}
          <AvatarFallback className="text-base">
            {getAgentInitials(agentName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-foreground">
            {agentName}
          </p>
          <p className="text-sm text-muted-foreground">Tu asesor</p>
        </div>
      </div>
      {(agentPhone || agentEmail) && (
        <div className="mt-4 space-y-2">
          {agentPhone && (
            <a
              href={`tel:${agentPhone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{agentPhone}</span>
            </a>
          )}
          {agentEmail && (
            <a
              href={`mailto:${agentEmail}`}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{agentEmail}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function AgencyCard({
  agency,
  logoInvertOnLight = false,
}: {
  agency: AgencyContact;
  logoInvertOnLight?: boolean;
}) {
  const { name, phone, email, logo } = agency;
  if (!logo && !phone && !email) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      {/* Just the agency logo, with contact details below. */}
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name}
          className={`h-20 w-full object-contain object-left${
            logoInvertOnLight ? " invert" : ""
          }`}
        />
      )}
      {(phone || email) && (
        <div className={`${logo ? "mt-5" : ""} space-y-2`}>
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{phone}</span>
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function PropertyPageClient({ property, agency, logoInvertOnLight }: PropertyPageClientProps) {
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
      // Ensure we have a valid listingId or propertyId
      const listingId = property.listingId?.toString();
      const propertyId = property.propertyId?.toString();
      
      console.log("[Property Inquiry] Starting submission", {
        listingId,
        propertyId,
        propertyKeys: Object.keys(property),
        hasListingId: !!property.listingId,
        hasPropertyId: !!property.propertyId,
      });
      
      if (!listingId && !propertyId) {
        console.error("[Property Inquiry] Missing IDs", { property });
        setError("Error: No se pudo identificar la propiedad. Por favor, recarga la página.");
        setIsSubmitting(false);
        return;
      }

      const formData: PropertyInquiryData = {
        name: formState.name,
        email: formState.email || undefined,
        phone: formState.phone,
        message: formState.message,
        propertyId: listingId || propertyId || "",
        propertyTitle: property.title || "Propiedad sin título",
        propertyPrice: property.price?.toString(),
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

  return (
    <div className="order-1 space-y-6 lg:order-2 lg:sticky lg:top-28 lg:self-start">
      {/* Acciones */}
      {!showContactForm && (
        <>
          {/* Mirror Vesta's "Cuenta" vs "Agente" toggle: when useAgentPhone is
              off the listing publishes the agency's contact, so show the agency
              card; otherwise show the assigned agent. Fall back to the agent
              card if agency data is unavailable. */}
          {!property.useAgentPhone && agency ? (
            <AgencyCard agency={agency} logoInvertOnLight={logoInvertOnLight} />
          ) : (
            <AgentCard property={property} />
          )}
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
          <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Contactar
          </span>
          <h3 className="mb-6 mt-2 pr-12 text-xl font-medium tracking-tight text-foreground">
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
            </form>
          )}
        </div>
      )}
    </div>
  );
}