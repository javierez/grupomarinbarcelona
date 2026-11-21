import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface QuickLink {
  text: string;
  href: string;
}

interface FooterLinkCardsProps {
  links: QuickLink[];
  visibility: Record<string, boolean>;
  className?: string;
}

/**
 * Footer navigation rendered as a grid of cards instead of a plain link list.
 * Used for accounts that prefer a card-based footer (e.g. account 139).
 */
export function FooterLinkCards({
  links,
  visibility,
  className,
}: FooterLinkCardsProps) {
  const visibleLinks = links.filter(
    (link) =>
      link.text.trim() !== "" &&
      visibility[link.text.toLowerCase()] !== false,
  );

  if (visibleLinks.length === 0) return null;

  return (
    <div className={className}>
      {/* Invisible spacer matching the sibling column headings (e.g. "Nuestras
          Oficinas") so the cards align vertically as if they had a title. */}
      <h3
        aria-hidden
        className="mb-6 select-none text-xs font-medium uppercase tracking-eyebrow text-transparent"
      >
        &nbsp;
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
        {visibleLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="group flex items-center justify-between gap-2 rounded-xl border border-tinta/10 bg-tinta/5 px-4 py-3.5 text-sm font-medium text-tinta/80 transition-colors hover:border-tinta/30 hover:bg-tinta/10 hover:text-tinta"
          >
            <span>{link.text}</span>
            <ArrowUpRight className="h-4 w-4 flex-shrink-0 text-tinta/40 transition-colors group-hover:text-tinta" />
          </Link>
        ))}
      </div>
    </div>
  );
}
