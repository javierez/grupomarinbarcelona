"use client";

import { useEffect, useState, type ComponentProps } from "react";
import {
  CategoryPanel,
  type CategoryPanelCardInput,
} from "~/components/category-panel";
import { announceReady } from "./preview-patch";

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
  promotionsEnabled,
  menuLabels,
}: {
  initialCards: RawCard[];
} & Omit<ComponentProps<typeof CategoryPanel>, "cards">) {
  const [cards, setCards] = useState<RawCard[]>(initialCards);

  useEffect(() => {
    announceReady();
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

  // Lo mismo que la web (`Portada`), con los enlaces apagados.
  return (
    <CategoryPanel
      cards={inputs}
      promotionsEnabled={promotionsEnabled}
      menuLabels={menuLabels}
    />
  );
}
