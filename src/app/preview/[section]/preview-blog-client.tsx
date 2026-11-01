"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BlogHero } from "~/components/blog/blog-hero";
import { PostList } from "~/components/blog/post-list";
import { formatPostDate, readTimeLabel } from "~/lib/blog";
import type { BlogPost, BlogProps } from "~/server/queries/blog";
import { announceReady, readPreviewMessage, slice } from "./preview-patch";

/** Slice names the editor sends. Order matters: the first is the bare shape. */
const KEYS = ["blogProps", "blogPosts"] as const;

/**
 * The editor holds los artículos as plain JSON, so its dates arrive as ISO
 * strings. Everything downstream formats real Dates — `formatPostDate` calls
 * `Intl.format`, which throws on a string.
 */
function revivePost(raw: unknown): BlogPost {
  const post = raw as Record<string, unknown>;
  const toDate = (value: unknown): Date | null => {
    if (value instanceof Date) return value;
    // Anything else has to be an ISO string or a timestamp; an object here
    // would stringify to "[object Object]" and silently become Invalid Date.
    if (typeof value !== "string" && typeof value !== "number") return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  return {
    ...(post as unknown as BlogPost),
    publishedAt: toDate(post.publishedAt),
    updatedAt: toDate(post.updatedAt) ?? new Date(0),
  };
}

/**
 * The /blog index, following the editor live.
 *
 * Mirrors `src/app/blog/page.tsx` — same components, same order. Keep the two
 * in sync. The one deliberate difference is the empty state: the real page
 * calls `notFound()` so a blog with nothing published never advertises itself,
 * but a 404 inside the editor's iframe reads as "the preview is broken".
 */
export function PreviewBlogClient({
  initialProps,
  initialPosts,
  footerSlot,
}: {
  initialProps: BlogProps;
  initialPosts: BlogPost[];
  footerSlot: ReactNode;
}) {
  const [props, setProps] = useState<BlogProps>(initialProps);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);

  useEffect(() => {
    announceReady();
    const onMessage = (e: MessageEvent) => {
      const msg = readPreviewMessage(e.data, "blog");
      if (!msg) return;

      const nextProps = slice<Partial<BlogProps>>(msg.patch, "blogProps", KEYS);
      if (nextProps) setProps((prev) => ({ ...prev, ...nextProps }));

      const nextPosts = slice<unknown[]>(msg.patch, "blogPosts", KEYS);
      if (Array.isArray(nextPosts)) setPosts(nextPosts.map(revivePost));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (posts.length === 0) {
    return (
      <main className="flex min-h-[200px] items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
        Todavía no hay artículos publicados, así que la página /blog no se
        publica. Los borradores no cuentan.
      </main>
    );
  }

  // The hero is the lead story: the post explicitly marked as featured,
  // otherwise the most recent one.
  const hero = posts.find((post) => post.featured) ?? posts[0]!;
  const rest = posts.filter((post) => post.id !== hero.id);

  return (
    <main className="min-h-screen bg-background">
      <BlogHero
        eyebrow={props.eyebrow ?? hero.category ?? props.pageTitle ?? "Blog"}
        title={hero.title}
        subtitle={hero.excerpt ?? props.pageSubtitle}
        image={hero.coverImage ?? props.heroImage}
        imageAlt={hero.coverAlt ?? ""}
        href={`/blog/${hero.slug}`}
        meta={[
          formatPostDate(hero.publishedAt),
          readTimeLabel(hero.readMinutes),
        ].filter(Boolean)}
      />

      {(props.pageTitle ?? props.pageSubtitle) && (
        <section className="container mx-auto px-4 pt-20 sm:px-6 sm:pt-28">
          <div className="max-w-2xl">
            {props.pageTitle && (
              <h2 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                {props.pageTitle}
              </h2>
            )}
            {props.pageSubtitle && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {props.pageSubtitle}
              </p>
            )}
          </div>
        </section>
      )}

      <PostList posts={rest.length > 0 ? rest : posts} />

      {footerSlot}
    </main>
  );
}
