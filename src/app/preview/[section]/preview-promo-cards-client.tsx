"use client";

import { useEffect, useState } from "react";
import {
  CategoryPanel,
  type CategoryPanelCardInput,
} from "~/components/category-panel";

// Looser shape that mirrors what the admin form holds (subset of PromoCard).
// We don't need the full kind-specific fields for the preview because we
// always render with `href="#"` (preview-only navigation).
interface RawCard {
  id?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  position?: number;
}

export function PreviewPromoCardsClient({
  initialCards,
}: {
  initialCards: RawCard[];
}) {
  const [cards, setCards] = useState<RawCard[]>(initialCards);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: RawCard[];
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "promo-cards"
      )
        return;
      if (Array.isArray(data.patch)) {
        setCards(data.patch);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const sorted = [...cards].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const inputs: CategoryPanelCardInput[] = sorted.map((c) => ({
    title: c.title ?? "Sin título",
    subtitle: c.subtitle ?? "",
    href: "#",
    imageUrl: c.imageUrl ?? "",
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CategoryPanel cards={inputs} />
    </div>
  );
}
