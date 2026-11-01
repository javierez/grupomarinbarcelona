"use client";

import { useEffect, useState } from "react";

import { registerBlogView } from "~/server/actions/blog-views";

const SESSION_KEY = "blog-views-counted";

function alreadyCounted(): string[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    // sessionStorage bloqueado o contenido corrupto: se cuenta y ya está.
    return [];
  }
}

/**
 * Suma una lectura al abrir el artículo y enseña el total, discreto, en el
 * carril de metadatos, junto a la fecha y el tiempo de lectura.
 *
 * Arranca con la cifra que trae el render y la sustituye por la del servidor en
 * cuanto suma la propia. Pintar desde el primer momento importa: si esperara a
 * la respuesta, al recargar —cuando ya no se cuenta— el dato desaparecería del
 * carril y quedaría un hueco donde antes había un número.
 *
 * Recargar en la misma pestaña no vuelve a contar: el slug queda apuntado en
 * sessionStorage. No es una defensa contra quien quiera inflarlo a propósito,
 * pero sí evita el caso real —volver atrás y entrar otra vez— que convertía la
 * cifra en ruido.
 *
 * Con 0 lecturas no se pinta nada: un artículo recién publicado no necesita
 * anunciar que no lo ha leído nadie.
 */
export function ArticleViews({
  slug,
  initialCount,
}: {
  slug: string;
  initialCount: number;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;
    const counted = alreadyCounted();
    if (counted.includes(slug)) return;

    void registerBlogView(slug).then((total) => {
      if (cancelled || total === null) return;
      setCount(total);
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify([...counted, slug]));
      } catch {
        // Sin almacenamiento: como mucho se cuenta de más al recargar.
      }
    });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (count <= 0) return null;

  return (
    <div>
      <dt className="text-[11px] uppercase tracking-eyebrow text-muted-foreground">
        Lecturas
      </dt>
      <dd className="mt-1.5 text-sm tabular-nums text-muted-foreground">
        {new Intl.NumberFormat("es-ES").format(count)}
      </dd>
    </div>
  );
}
