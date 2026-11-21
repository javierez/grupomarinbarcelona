"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { buildSearchSlug, type SearchParams } from "~/lib/search-utils";
import { activePriceBand, type PriceBand } from "~/lib/price-bands";

const ANY = "cualquiera";

interface PriceBandBarProps {
  bands: (PriceBand & { count: number })[];
  /** The same search without any price, for «Cualquier precio». */
  totalCount: number;
  initialParams: SearchParams;
}

/**
 * The results-page search as one line: a price dropdown with fixed bands and
 * nothing to type (GO4, Guille 4-nov-2026: «la gente no quiere teclear, y si
 * no aparece ningún resultado me pierden el interés»). Picking a band opens
 * its results straight away. The rest of the URL (type, city, ?q=, ?vista=)
 * is kept, exactly as the full SearchBar does.
 */
export function PriceBandBar({ bands, totalCount, initialParams }: PriceBandBarProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const active = activePriceBand(bands, initialParams.minPrice, initialParams.maxPrice);

  const go = (key: string) => {
    const band = bands.find((b) => b.key === key);
    const slug = buildSearchSlug({
      ...initialParams,
      minPrice: band?.minPrice,
      maxPrice: band?.maxPrice,
    });
    const next = new URLSearchParams();
    const q = urlSearchParams?.get("q");
    const vista = urlSearchParams?.get("vista");
    if (q) next.set("q", q);
    if (vista) next.set("vista", vista);
    const qs = next.toString();
    router.push(`/${slug}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Select value={active?.key ?? ANY} onValueChange={go}>
        <SelectTrigger
          aria-label="Precio"
          className="h-14 gap-4 rounded-full border-border/60 bg-white px-6 text-base shadow-[0_30px_60px_-30px_rgba(15,23,42,0.25)] sm:px-7"
        >
          <span className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
            Precio
          </span>
          <span className="h-6 w-px bg-border" aria-hidden />
          <span className="flex-1 text-left text-foreground">
            <SelectValue>{active?.label ?? "Cualquier precio"}</SelectValue>
          </span>
        </SelectTrigger>
        <SelectContent>
          {[{ key: ANY, label: "Cualquier precio", count: totalCount }, ...bands].map((b) => (
            // The count sits inside the item text, so the trigger shows its own
            // label (SelectValue children) instead of «… 11 inmuebles».
            <SelectItem
              key={b.key}
              value={b.key}
              disabled={b.count === 0}
              className="py-2.5 text-base [&>span:last-child]:w-full"
            >
              <span className="flex w-full items-center justify-between gap-6">
                <span>{b.label}</span>
                <span className="text-xs text-muted-foreground">
                  {b.count} {b.count === 1 ? "inmueble" : "inmuebles"}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
