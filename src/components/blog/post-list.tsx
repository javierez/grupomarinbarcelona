"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { BlogPost } from "~/server/queries/blog";
import { PostCard } from "./post-card";

const ALL = "__all__";

/**
 * The article register: an optional category filter, then a lead card followed
 * by a three-up grid. Filtering is client-side because a blog holds tens of
 * posts, not thousands — a round trip per category would be slower than useful.
 */
export function PostList({ posts }: { posts: BlogPost[] }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<string>(ALL);

  const categories = useMemo(() => {
    const seen = new Map<string, number>();
    for (const post of posts) {
      if (!post.category) continue;
      seen.set(post.category, (seen.get(post.category) ?? 0) + 1);
    }
    return Array.from(seen.entries()).map(([name, count]) => ({ name, count }));
  }, [posts]);

  const visible = useMemo(
    () => (active === ALL ? posts : posts.filter((p) => p.category === active)),
    [posts, active],
  );

  const [lead, ...rest] = visible;

  const reveal = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-80px" },
          transition: { duration: 0.5, delay: Math.min(index, 3) * 0.08 },
        };

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <h2 className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
          Todos los artículos
          <span className="ml-3 tabular-nums text-foreground">{visible.length}</span>
        </h2>

        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <FilterButton
              label="Todos"
              active={active === ALL}
              onClick={() => setActive(ALL)}
            />
            {categories.map((category) => (
              <FilterButton
                key={category.name}
                label={category.name}
                count={category.count}
                active={active === category.name}
                onClick={() => setActive(category.name)}
              />
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Todavía no hay artículos en esta categoría.
        </p>
      ) : (
        <>
          {lead && (
            <motion.div {...reveal(0)} className="pt-12 sm:pt-16">
              <PostCard post={lead} variant="lead" priority />
            </motion.div>
          )}

          {rest.length > 0 && (
            <div className="mt-16 grid gap-x-8 gap-y-14 border-t border-border pt-16 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post, index) => (
                <motion.div key={post.id} {...reveal(index)}>
                  <PostCard post={post} />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-xs uppercase tracking-eyebrow transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        active ? "text-brand" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 tabular-nums text-muted-foreground/60">{count}</span>
      )}
    </button>
  );
}
