"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface QuickLink {
  text: string;
  href: string;
}

interface QuickLinksSectionProps {
  links: QuickLink[];
  visibility: Record<string, boolean>;
}

export function QuickLinksSection({ links, visibility }: QuickLinksSectionProps) {
  const [showAll, setShowAll] = useState(false);

  // Filter links based on visibility
  const visibleLinks = links.filter(
    (link) => visibility[link.text.toLowerCase()] !== false
  );

  // Show only first 4 links initially
  const displayedLinks = showAll ? visibleLinks : visibleLinks.slice(0, 4);
  const hasMoreLinks = visibleLinks.length > 4;

  return (
    <div>
      <h3 className="mb-6 text-xs font-medium uppercase tracking-eyebrow text-white/50">
        Enlaces Rápidos
      </h3>
      <nav>
        <ul className="space-y-3">
          {displayedLinks.map((link, index) => (
            <li key={index}>
              <Link
                href={link.href}
                className="block text-sm text-white/70 transition-colors hover:text-white"
              >
                {link.text}
              </Link>
            </li>
          ))}
          {hasMoreLinks && (
            <li>
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:text-white"
                aria-label={showAll ? "Ver menos" : "Ver más"}
              >
                {showAll ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}