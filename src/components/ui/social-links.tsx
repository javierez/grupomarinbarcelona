"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { useAspectoV1 } from "~/components/header-style-context";
import { cn } from "~/lib/utils";

export interface SocialLink {
  platform:
    | "facebook"
    | "twitter"
    | "instagram"
    | "linkedin"
    | "youtube"
    | "tiktok";
  url: string;
  previewImage?: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.69a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.12Z" />
    </svg>
  );
}

// La de las webs v1 (`aspectoV1`): el trazo de lucide, no el logo relleno.
function TikTokV1({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const platformIcons = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: TikTokIcon,
};

export function SocialLinks({
  links,
  size = "md",
  className,
  iconClassName,
}: SocialLinksProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  const v1 = useAspectoV1();

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {links.map((link) => {
        const Icon =
          v1 && link.platform === "tiktok" ? TikTokV1 : platformIcons[link.platform];
        if (!Icon) return null;
        return (
          <Link
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visítanos en ${link.platform}`}
            className={v1 ? "transition-colors hover:text-primary" : "transition-colors hover:text-foreground"}
          >
            <Icon
              className={cn(
                sizeClasses[size],
                v1 ? "text-muted-foreground hover:text-primary" : "text-muted-foreground transition-colors hover:text-foreground",
                iconClassName,
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
