import { Phone } from "lucide-react";

interface CallButtonProps {
  /** Enlace tel: ya validado (ver ~/lib/call-number). */
  telHref?: string | null;
  /** Si también hay botón de WhatsApp, este se coloca encima. */
  stackAboveWhatsApp: boolean;
}

export function CallButton({ telHref, stackAboveWhatsApp }: CallButtonProps) {
  if (!telHref) return null;

  const position = stackAboveWhatsApp
    ? "bottom-24 sm:bottom-28"
    : "bottom-6 sm:bottom-8";

  return (
    <a
      href={telHref}
      aria-label="Llamar por teléfono"
      className={`fixed right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-900 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.25)] ring-1 ring-black/10 transition-all hover:scale-105 hover:bg-gray-50 sm:right-8 ${position}`}
    >
      <Phone className="h-6 w-6" />
    </a>
  );
}
