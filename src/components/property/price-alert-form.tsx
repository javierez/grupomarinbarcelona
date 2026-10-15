"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { submitPriceAlert } from "~/server/actions/property-inquiry";

/** «Avísame si baja el precio»: un correo y la casilla de protección de datos. */
export function PriceAlertForm({
  listingId,
  title,
}: {
  listingId: string;
  title: string;
}) {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) {
      setError("Acepta la política de protección de datos para avisarte.");
      return;
    }
    setSending(true);
    setError(null);
    const result = await submitPriceAlert({
      email,
      propertyId: listingId,
      propertyTitle: title,
      acceptedPrivacy: true,
      honeypot: honeypot || undefined,
    });
    setSending(false);
    if (result.success) setDone(true);
    else setError(result.error);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6">
      <span className="block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Avísame si baja el precio
      </span>
      {done ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Hecho. Te escribiremos a {email} si baja el precio de este inmueble.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }}>
            <label htmlFor="alerta-website">Website</label>
            <input
              id="alerta-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="alerta-email"
              className="mb-1.5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground"
            >
              Email
            </label>
            <input
              type="email"
              id="alerta-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-4 text-base transition-colors hover:border-foreground/30 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:text-sm"
              placeholder="tu@email.com"
              required
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5"
            />
            <span>
              Acepto la{" "}
              <Link href="/proteccion-de-datos" className="underline hover:text-foreground">
                política de protección de datos
              </Link>
              .
            </span>
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="outline" size="pill" className="w-full" disabled={sending}>
            {sending ? "Guardando..." : "Avisarme"}
          </Button>
        </form>
      )}
    </div>
  );
}
