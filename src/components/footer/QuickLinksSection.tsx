"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FooterHeading, footerLinkClass, footerListClass } from "./footer-v1";

interface QuickLink {
  text: string;
  href: string;
}

interface QuickLinksSectionProps {
  links: QuickLink[];
  visibility: Record<string, boolean>;
  /** `features_props.aspectoV1`: the v1 look. */
  v1?: boolean;
}

export function QuickLinksSection({ links, visibility, v1 = false }: QuickLinksSectionProps) {
  const [showAll, setShowAll] = useState(false);

  // Filter links based on visibility. The v1 kept a link with no text: it
  // draws as an empty row (Ecogar's footer is 12 px taller because of it).
  const visibleLinks = links.filter(
    (link) =>
      (v1 || link.text.trim() !== "") &&
      visibility[link.text.toLowerCase()] !== false
  );

  // Show only first 4 links initially
  const displayedLinks = showAll ? visibleLinks : visibleLinks.slice(0, 4);
  const hasMoreLinks = visibleLinks.length > 4;

  return (
    <div className={v1 ? "lg:pl-8" : undefined}>
      <FooterHeading v1={v1}>Enlaces Rápidos</FooterHeading>
      <nav>
        <ul className={footerListClass(v1)}>
          {displayedLinks.map((link, index) => (
            <li key={index}>
              <Link
                href={link.href}
                className={footerLinkClass(v1)}
              >
                {link.text}
              </Link>
            </li>
          ))}
          {hasMoreLinks && (
            <li className={v1 ? "flex justify-start" : undefined}>
              <button
                onClick={() => setShowAll(!showAll)}
                className={
                  v1
                    ? "flex w-12 items-center justify-center rounded-md bg-white/10 py-1.5 text-base font-medium text-muted-foreground shadow-md backdrop-blur-sm transition-all duration-300 hover:font-semibold hover:text-primary hover:shadow-lg"
                    : "flex h-9 w-9 items-center justify-center rounded-full border border-tinta/20 text-tinta/70 transition-colors hover:border-tinta/40 hover:text-tinta"
                }
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