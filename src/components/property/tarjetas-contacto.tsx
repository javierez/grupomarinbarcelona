import { Mail, Phone } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import type { AgentePublico } from "~/lib/ficha-publica";

// Las tarjetas de contacto de la ficha: el agente, la oficina de hoy y la
// de la v1 (`fichaTarjetaOficina`). Las pinta ~/app/propiedades/[id]/property-page-client.

export interface AgencyContact {
  name: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
}

function getAgentInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AgentCard({ agente }: { agente: AgentePublico }) {
  const agentName = (agente.name ?? "").trim();
  if (!agentName) return null;

  const { image: agentImage, phone: agentPhone, email: agentEmail } = agente;

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

function ContactLinks({ phone, email }: { phone: string | null; email: string | null }) {
  return (
    <>
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
    </>
  );
}

/** La de la v1: logo redondo (o la inicial), el nombre y, debajo, sus datos. */
export function OfficeCard({
  agency,
  logoInvertOnLight = false,
}: {
  agency: AgencyContact;
  logoInvertOnLight?: boolean;
}) {
  const { name, phone, email, logo } = agency;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full ${
            logo ? "bg-white" : "bg-muted"
          }`}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={name}
              className={`h-full w-full object-contain${logoInvertOnLight ? " invert" : ""}`}
            />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">
              {name.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-base font-medium text-foreground">{name}</p>
          <ContactLinks phone={phone} email={email} />
        </div>
      </div>
    </div>
  );
}

export function AgencyCard({
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
          <ContactLinks phone={phone} email={email} />
        </div>
      )}
    </div>
  );
}
