"use client";

import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

// The name the cookies policy lists under "Cookies Técnicas".
const COOKIE = "cookieConsent";
type Choice = "granted" | "denied";

function readChoice(): Choice | null {
  const match = new RegExp(`(?:^|; )${COOKIE}=(granted|denied)`).exec(
    document.cookie,
  );
  return (match?.[1] as Choice | undefined) ?? null;
}

/** OpenAI's snippet as OpenAI hands it out, with `debug` left off. */
function OpenAiPixel({ pixelId }: { pixelId: string }) {
  return (
    <Script id="openai-pixel" strategy="afterInteractive">
      {`!function(w,d,s,u){if(w.oaiq)return;var q=function(){q.q.push(arguments)};q.q=[];w.oaiq=q;var j=d.createElement(s);j.async=1;j.src=u;var f=d.getElementsByTagName(s)[0];f.parentNode.insertBefore(j,f)}(window,document,"script","https://bzrcdn.openai.com/sdk/oaiq.min.js");oaiq("init",{pixelId:${JSON.stringify(pixelId)}});`}
    </Script>
  );
}

/** El código del píxel de Meta tal como lo da Meta, con su PageView. */
function MetaPixel({ pixelId }: { pixelId: string }) {
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`}
    </Script>
  );
}

/**
 * LSSI 22.2: Google Analytics / Tag Manager and the OpenAI and Meta ads pixels load only
 * after the visitor accepts. Mounted only when the agency has one of them:
 * without any the site sets no cookie that needs asking for, so no banner.
 */
export function ConsentAnalytics({
  tagId,
  isTagManager,
  openaiPixelId,
  metaPixelId,
}: {
  tagId?: string;
  isTagManager: boolean;
  openaiPixelId?: string;
  metaPixelId?: string;
}) {
  // undefined = not read yet (server render), so nothing flashes.
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined);
  useEffect(() => setChoice(readChoice()), []);

  const decide = (next: Choice) => {
    document.cookie = `${COOKIE}=${next}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
    setChoice(next);
  };

  if (choice === "granted") {
    return (
      <>
        {tagId &&
          (isTagManager ? (
            <GoogleTagManager gtmId={tagId} />
          ) : (
            <GoogleAnalytics gaId={tagId} />
          ))}
        {openaiPixelId && <OpenAiPixel pixelId={openaiPixelId} />}
        {metaPixelId && <MetaPixel pixelId={metaPixelId} />}
      </>
    );
  }
  if (choice !== null) return null;

  const publicidad = (openaiPixelId ?? metaPixelId) !== undefined;
  // En el móvil, pequeño y a la izquierda del botón de WhatsApp (bottom-6
  // right-6): antes tapaba la foto de la ficha hasta contestar (122, 17-nov).
  return (
    <div
      role="dialog"
      aria-label="Cookies"
      className="fixed bottom-6 left-3 right-[5.5rem] z-50 rounded-lg border border-border bg-background p-3 shadow-lg sm:inset-x-4 sm:bottom-4 sm:mx-auto sm:flex sm:max-w-xl sm:items-center sm:gap-4 sm:p-4"
    >
      <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
        <span className="sm:hidden">
          {publicidad ? "Cookies de análisis y publicidad" : "Cookies de análisis"}, solo
          si las aceptas.
        </span>
        <span className="hidden sm:inline">
          {publicidad
            ? "Usamos cookies de análisis y de publicidad para saber cómo se usa la web y medir nuestros anuncios. Solo se activan si las aceptas."
            : "Usamos cookies de análisis para saber cómo se usa la web. Solo se activan si las aceptas."}
        </span>{" "}
        <Link href="/cookies" className="underline underline-offset-4">
          Más información
        </Link>
      </p>
      <div className="mt-2 flex shrink-0 gap-2 sm:mt-0">
        <Button variant="outline" size="sm" onClick={() => decide("denied")}>
          Rechazar
        </Button>
        <Button size="sm" onClick={() => decide("granted")}>
          Aceptar
        </Button>
      </div>
    </div>
  );
}

/** Withdrawing consent: forget the choice so the banner asks again. */
export function ResetConsentButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        document.cookie = `${COOKIE}=; Max-Age=0; Path=/`;
        window.location.reload();
      }}
    >
      Cambiar mis preferencias
    </Button>
  );
}
