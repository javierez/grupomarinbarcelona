"use client";

import { useState } from "react";
import { Share2, Check, Mail, Link2, MessageCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

/**
 * «Enviar a un amigo»: tres enlaces que abre el propio navegador del visitante
 * (WhatsApp, su correo, copiar). Nada pasa por el servidor a propósito: un
 * formulario de envío dejaría a cualquiera mandar correos desde el dominio de
 * la agencia a quien quisiera.
 */
export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const shareText = () => `${document.title} ${window.location.href}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Enviar a un amigo"
          title="Enviar a un amigo"
          className="h-12 w-12 rounded-full border-border/60 hover:border-foreground/40 hover:bg-accent"
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(shareText())}`,
              "_blank",
              "noopener,noreferrer",
            )
          }
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            window.location.href = `mailto:?subject=${encodeURIComponent(document.title)}&body=${encodeURIComponent(window.location.href)}`;
          }}
        >
          <Mail className="mr-2 h-4 w-4" />
          Correo
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={copy}>
          <Link2 className="mr-2 h-4 w-4" />
          Copiar enlace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
