"use client";

import { useEffect, useState } from "react";
import { storedLang } from "~/components/language-switcher";
import { DEFAULT_LANG, LANG_EVENT } from "~/lib/site-languages";

/**
 * La descripción de la ficha. En castellano salvo que el visitante haya
 * elegido un idioma para el que el CRM ya guarda una traducción: entonces se
 * enseña esa, marcada `notranslate` para que el traductor automático de la web
 * no la toque. Sin traducción guardada, el castellano se queda y lo traduce él
 * como el resto de la página.
 */
export function TranslatedDescription({
  description,
  translations,
  className,
}: {
  description: string;
  translations: Record<string, string>;
  className?: string;
}) {
  const [lang, setLang] = useState(DEFAULT_LANG);
  const offered = Object.keys(translations).join(",");

  useEffect(() => {
    if (!offered) return;
    setLang(storedLang(offered.split(",")));
    const onChange = (e: Event) =>
      setLang((e as CustomEvent<string>).detail ?? DEFAULT_LANG);
    window.addEventListener(LANG_EVENT, onChange);
    return () => window.removeEventListener(LANG_EVENT, onChange);
  }, [offered]);

  const translated = translations[lang];
  // `key`: el traductor automático cambia los nodos de texto por los suyos; al
  // cambiar de idioma React monta un párrafo nuevo en vez de reusar uno tocado.
  return translated ? (
    <p key={lang} lang={lang} translate="no" className={`notranslate ${className ?? ""}`}>
      {translated}
    </p>
  ) : (
    <p key={DEFAULT_LANG} className={className}>
      {description}
    </p>
  );
}
