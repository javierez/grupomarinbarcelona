"use client";

import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

// GTranslate's translation engine (the same one its WordPress plugin and
// `ln.js` widget load). On load it re-applies the language stored in
// localStorage, so a visitor who picked English stays in English across pages.
const GT_LIB_SRC = "https://cdn.gtranslate.net/widgets/latest/lib.min.js";
const GT_STORAGE_KEY = "__GT_TRANSLATE_LANGS";
const DEFAULT_LANG = "es";

const LANGUAGES = [
  { code: "es", label: "ES", name: "Español" },
  { code: "en", label: "EN", name: "English" },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

interface GTranslator {
  translate(src: string, tgt: string): boolean;
  revert(): void;
}

declare global {
  interface Window {
    __GT?: { translator?: GTranslator };
  }
}

function storedLang(): LangCode {
  try {
    const raw = localStorage.getItem(GT_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as { tgtLang?: unknown }) : null;
    return parsed?.tgtLang === "en" ? "en" : DEFAULT_LANG;
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

export function LanguageSwitcher({ onDark = false }: { onDark?: boolean }) {
  const [current, setCurrent] = useState<LangCode>(DEFAULT_LANG);

  useEffect(() => {
    const lang = storedLang();
    setCurrent(lang);
    // The engine restores the stored language by itself once loaded.
    if (lang !== DEFAULT_LANG) void loadTranslator();
  }, []);

  async function select(lang: LangCode) {
    if (lang === current) return;
    setCurrent(lang);
    const translator = await loadTranslator();
    if (!translator) return;
    if (lang === DEFAULT_LANG) translator.revert();
    else translator.translate(DEFAULT_LANG, lang);
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
      {LANGUAGES.map(({ code, label, name }) => {
        const active = code === current;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            title={name}
            aria-pressed={active}
            onClick={() => void select(code)}
            className={cn(
              "h-full min-w-8 rounded-full px-2 transition-colors",
              active
                ? onDark
                  ? "bg-white text-gray-900"
                  : "bg-foreground text-background"
                : onDark
                  ? "text-white hover:bg-white/20"
                  : "text-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
