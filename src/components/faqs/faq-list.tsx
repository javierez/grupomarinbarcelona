"use client";

import { useEffect, useState } from "react";
import type { FaqCategory } from "~/server/queries/website-config";
import {
  announceReady,
  readPreviewMessage,
  slice,
} from "~/app/preview/[section]/preview-patch";

/** Slice names the editor sends. Order matters: the first is the bare shape. */
const KEYS = ["faqsProps"] as const;

/**
 * The accordion list on /faqs.
 *
 * Split out of `FaqsContent` — which is a server component and so could never
 * follow an edit — for one reason: the CRM's FAQs tab renders this very page in
 * its preview, and until now every change to a question sat invisible until the
 * agency reloaded the frame.
 *
 * `live` is what keeps that cost off the public site: the real page renders the
 * same markup with no listener attached.
 */
export function FaqList({
  initial,
  fallback,
  live = false,
}: {
  /** The account's own FAQs. Empty when it has never configured any. */
  initial: FaqCategory[];
  /** Built-in set shown when the account has none of its own. */
  fallback: FaqCategory[];
  live?: boolean;
}) {
  const [categories, setCategories] = useState<FaqCategory[]>(
    initial.length > 0 ? initial : fallback,
  );

  useEffect(() => {
    if (!live) return;
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e.data, "faqs");
      if (!msg) return;
      const next = slice<FaqCategory[]>(msg.patch, "faqsProps", KEYS);
      if (!Array.isArray(next)) return;
      // Emptying the list is a real edit, and the page's own rule is that no
      // account FAQs means the built-in set — so mirror it rather than
      // rendering a blank page the visitor would never see.
      setCategories(next.length > 0 ? next : fallback);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [live, fallback]);

  return (
    <div className="mx-auto max-w-4xl space-y-16">
      {categories.map((category, categoryIndex) => (
        <div key={categoryIndex}>
          <span className="mb-3 block text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Categoría {categoryIndex + 1}
          </span>
          <h2 className="mb-8 text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {category.category}
          </h2>

          <div className="space-y-0 border-t border-border/60">
            {category.questions.map((faq, faqIndex) => (
              <details
                key={faqIndex}
                className="group border-b border-border/60"
              >
                <summary className="cursor-pointer select-none list-none">
                  <div className="flex items-center justify-between gap-4 py-6 transition-colors hover:text-foreground">
                    <h3 className="text-base font-medium leading-snug text-foreground sm:text-lg">
                      {faq.question}
                    </h3>
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 group-open:rotate-180 group-open:border-foreground group-open:text-foreground">
                      &#9662;
                    </span>
                  </div>
                </summary>
                <div className="pb-6 pr-12">
                  <p className="text-base leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
