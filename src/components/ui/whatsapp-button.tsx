"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";

import { useAspectoV1 } from "~/components/header-style-context";

interface WhatsAppButtonProps {
  phoneNumber?: string | null;
}

export function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
  const v1 = useAspectoV1();
  // Don't render if no phone number
  if (!phoneNumber) return null;

  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  return (
    <Link
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      data-vesta="boton.whatsapp"
      className={
        v1
          ? "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110"
          : "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_25px_-5px_rgba(37,211,102,0.5)] ring-1 ring-white/20 transition-all hover:bg-[#1FBA57] hover:scale-105 sm:bottom-8 sm:right-8"
      }
    >
      <MessageCircle className="h-6 w-6" />
    </Link>
  );
}
