"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center">
      <span className="mb-5 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
        Error
      </span>
      <h1 className="mb-5 text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
        Algo salió mal
      </h1>
      <p className="mb-10 max-w-md text-base leading-relaxed text-muted-foreground">
        Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
      </p>
      <button
        onClick={reset}
        className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-base font-medium text-brand-foreground transition-colors hover:bg-brand/90"
      >
        Intentar de nuevo
      </button>
    </main>
  );
}
