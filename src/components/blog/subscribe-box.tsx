"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { subscribeToNewsletter } from "~/server/actions/newsletter-subscribe";

/**
 * «Suscríbete», al final de cada artículo. Quien deja su correo entra en los
 * contactos de la agencia con el permiso apuntado, y recibe sus campañas.
 */
export function SubscribeBox() {
  const [form, setForm] = useState({ name: "", email: "", honeypot: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setState("sending");
    setError(null);
    const result = await subscribeToNewsletter({
      name: form.name,
      email: form.email,
      honeypot: form.honeypot || undefined,
    });
    if (result.success) {
      setState("done");
      return;
    }
    setState("idle");
    setError(result.error ?? "No hemos podido apuntarte. Inténtalo de nuevo.");
  };

  return (
    <section className="mt-14 rounded-xl border border-border p-6 sm:p-8">
      <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Novedades
      </span>
      <h2 className="mt-2 font-display text-2xl font-light leading-snug text-foreground">
        Recibe artículos como este en tu correo
      </h2>

      {state === "done" ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Hecho. Te escribiremos cuando publiquemos algo nuevo.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3">
          {/* Honeypot: oculto para las personas, los bots lo rellenan. */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0 }}
          >
            <label htmlFor="subscribe-website">Website</label>
            <input
              id="subscribe-website"
              name="honeypot"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.honeypot}
              onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              name="name"
              aria-label="Tu nombre"
              placeholder="Tu nombre"
              autoComplete="name"
              required
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              name="email"
              type="email"
              aria-label="Tu correo"
              placeholder="Tu correo"
              autoComplete="email"
              required
              maxLength={255}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Button type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Enviando..." : "Suscribirme"}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Al suscribirte aceptas recibir nuestras comunicaciones comerciales.
            Puedes darte de baja cuando quieras.{" "}
            <Link href="/proteccion-de-datos" className="underline">
              Protección de datos
            </Link>
          </p>
        </form>
      )}
    </section>
  );
}
