"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Link2, Linkedin, MessageCircle } from "lucide-react";

import { ArticleViews } from "~/components/blog/article-views";

interface ArticleMetaRailProps {
  /** Slug del artículo; lo necesita el contador de lecturas. */
  slug: string;
  /** Lecturas ya contadas, del render. El contador suma la actual encima. */
  views: number;
  date: string;
  readTime: string;
  category?: string | null;
  authorName?: string | null;
  authorRole?: string | null;
  authorImage?: string | null;
  /** Absolute URL of the article, used by the share actions. */
  shareUrl: string;
  shareTitle: string;
}

/**
 * The rail that runs alongside the article: when it was published, how long it
 * takes to read, what it's about, who wrote it, and how to pass it on. Sticky on
 * desktop, a plain stacked block on mobile.
 */
export function ArticleMetaRail({
  slug,
  views,
  date,
  readTime,
  category,
  authorName,
  authorRole,
  authorImage,
  shareUrl,
  shareTitle,
}: ArticleMetaRailProps) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked (insecure context or denied permission); the
      // WhatsApp and LinkedIn actions still work.
    }
  };

  // Not sticky: the root layout wraps every page in `overflow-x-hidden`, which
  // creates a scrollport and makes `position: sticky` a no-op here.
  return (
    <aside>
      <dl className="space-y-6">
        <MetaItem label="Publicado" value={date} />
        <MetaItem label="Lectura" value={readTime} />
        <ArticleViews slug={slug} initialCount={views} />
        {category && <MetaItem label="Categoría" value={category} accent />}
      </dl>

      {authorName && (
        <div className="mt-8 flex items-center gap-3 border-t border-border pt-8">
          {authorImage && (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted">
              <Image
                src={authorImage}
                alt={authorName}
                fill
                className="object-cover"
                sizes="44px"
                unoptimized
              />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{authorName}</p>
            {authorRole && (
              <p className="truncate text-xs text-muted-foreground">{authorRole}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-border pt-8">
        <p className="text-[11px] uppercase tracking-eyebrow text-muted-foreground">Compartir</p>
        <div className="mt-3 flex items-center gap-2">
          <ShareLink
            href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`}
            label="Compartir por WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </ShareLink>
          <ShareLink
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
            label="Compartir en LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </ShareLink>
          <button
            type="button"
            onClick={copyLink}
            aria-label={copied ? "Enlace copiado" : "Copiar enlace"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {copied ? <Check className="h-4 w-4 text-brand" /> : <Link2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function MetaItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-eyebrow text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1.5 text-sm tabular-nums ${accent ? "text-brand" : "text-foreground"}`}
      >
        {value}
      </dd>
    </div>
  );
}

function ShareLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
    >
      {children}
    </a>
  );
}
