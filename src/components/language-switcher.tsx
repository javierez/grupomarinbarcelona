"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  DEFAULT_LANG,
  getSiteLanguage,
  gtCode,
  LANG_EVENT,
  parseStoredLang,
} from "~/lib/site-languages";
import { cn } from "~/lib/utils";

// GTranslate's translation engine (the same one its WordPress plugin and
// `ln.js` widget load). On load it re-applies the language stored in
// localStorage, so a visitor who picked English stays in English across pages.
const GT_LIB_SRC = "https://cdn.gtranslate.net/widgets/latest/lib.min.js";
const GT_STORAGE_KEY = "__GT_TRANSLATE_LANGS";

interface GTranslator {
  translate(src: string, tgt: string): boolean;
  revert(): void;
}

declare global {
  interface Window {
    __GT?: { translator?: GTranslator };
  }
}

/** El idioma en que el visitante dejó la web, entre los que esta ofrece. */
export function storedLang(offered: readonly string[]): string {
  try {
    return parseStoredLang(localStorage.getItem(GT_STORAGE_KEY), offered);
  } catch {
    return DEFAULT_LANG;
  }
}

// The translator swaps text nodes under React's feet; without this a later
// re-render (filters, carousels, client navigation) throws NotFoundError
// trying to remove or insert next to a node the translator already replaced.
function patchDomForTranslation() {
  const proto = Node.prototype as Node & { __gtPatched?: boolean };
  if (proto.__gtPatched) return;
  proto.__gtPatched = true;

  // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound via .call below
  const removeChild = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound via .call below
  const insertBefore = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(
    this: Node,
    node: T,
    ref: Node | null,
  ): T {
    if (ref && ref.parentNode !== this) return node;
    return insertBefore.call(this, node, ref) as T;
  };
}

let libPromise: Promise<GTranslator | null> | null = null;

function loadTranslator(): Promise<GTranslator | null> {
  libPromise ??= new Promise((resolve) => {
    patchDomForTranslation();
    const script = document.createElement("script");
    script.src = GT_LIB_SRC;
    script.async = true;
    script.onload = () => resolve(window.__GT?.translator ?? null);
    script.onerror = () => {
      libPromise = null;
      resolve(null);
    };
    document.body.appendChild(script);
  });
  return libPromise;
}

/**
 * `languages`: los idiomas que ofrece la web además del castellano (ver
 * `siteLanguagesFor`). Con uno solo es el par ES/EN de siempre; con más, un
 * desplegable.
 *
 * `variant="plain"` (navbar «simple»): siempre desplegable, sin borde, con
 * bandera y nombre como texto del menú — «🇪🇸 Español ▾», como las webs eGO.
 */
export function LanguageSwitcher({
  languages,
  onDark = false,
  variant = "pill",
}: {
  languages: readonly string[];
  onDark?: boolean;
  variant?: "pill" | "plain";
}) {
  const [current, setCurrent] = useState(DEFAULT_LANG);
  const offered = languages.join(",");

  useEffect(() => {
    const lang = storedLang(offered.split(","));
    setCurrent(lang);
    // The engine restores the stored language by itself once loaded.
    if (lang !== DEFAULT_LANG) void loadTranslator();
  }, [offered]);

  async function select(lang: string) {
    if (lang === current) return;
    setCurrent(lang);
    // La ficha cambia su descripción por la traducción guardada antes de que
    // el motor recorra la página, para que no la traduzca él.
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: lang }));
    const translator = await loadTranslator();
    if (!translator) return;
    if (lang === DEFAULT_LANG) translator.revert();
    else translator.translate(DEFAULT_LANG, gtCode(lang));
  }

  const options = [DEFAULT_LANG, ...languages];
  const plain = variant === "plain";
  const label = (code: string) => {
    const lang = getSiteLanguage(code);
    return plain && lang?.flag ? `${lang.flag} ${lang.name}` : lang?.name;
  };

  if (options.length > 2 || plain) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          translate="no"
          aria-label="Idioma / Language"
          className={cn(
            "notranslate flex h-9 items-center",
            plain
              ? cn(
                  "gap-1.5 whitespace-nowrap px-1 text-[17px] font-normal outline-none transition-opacity hover:opacity-75",
                  onDark
                    ? "text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]"
                    : "text-foreground/85",
                )
              : cn(
                  "gap-1.5 rounded-full border px-3 text-xs font-medium",
                  onDark
                    ? "border-white/30 bg-white/10 text-white backdrop-blur"
                    : "border-input bg-background text-foreground",
                ),
          )}
        >
          {!plain && <Languages className="h-3.5 w-3.5" />}
          {label(current)}
          <ChevronDown className={plain ? "h-4 w-4" : "h-3 w-3"} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" translate="no" className="notranslate">
          <DropdownMenuRadioGroup
            value={current}
            onValueChange={(lang) => void select(lang)}
          >
            {options.map((code) => (
              <DropdownMenuRadioItem key={code} value={code} lang={code}>
                {label(code)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      translate="no"
      className={cn(
        "notranslate flex h-9 items-center rounded-full border p-0.5 text-xs font-semibold",
        onDark ? "border-white/30 bg-white/10 backdrop-blur" : "border-input bg-background",
      )}
    >
      {options.map((code) => {
        const active = code === current;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            title={getSiteLanguage(code)?.name}
            aria-pressed={active}
            onClick={() => void select(code)}
            className={cn(
              "h-full min-w-8 rounded-full px-2 uppercase transition-colors",
              active
                ? onDark
                  ? "bg-white text-gray-900"
                  : "bg-foreground text-background"
                : onDark
                  ? "text-white hover:bg-white/20"
                  : "text-foreground hover:bg-accent",
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
