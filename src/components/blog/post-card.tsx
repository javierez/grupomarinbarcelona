import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "~/server/queries/blog";
import { formatPostDateShort, isoDate, readTimeLabel } from "~/lib/blog";

interface PostCardProps {
  post: BlogPost;
  /** "lead" runs the card horizontally with a bigger image — used for the first row. */
  variant?: "default" | "lead";
  /** Only the first cards above the fold should preload their image. */
  priority?: boolean;
}

export function PostCard({ post, variant = "default", priority = false }: PostCardProps) {
  const lead = variant === "lead";

  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block focus:outline-none">
        <div
          className={
            lead
              ? "grid items-center gap-6 sm:gap-10 md:grid-cols-2"
              : "flex h-full flex-col"
          }
        >
          <div
            className={`relative overflow-hidden rounded-2xl bg-muted ${
              lead ? "aspect-[4/3]" : "aspect-[3/2]"
            }`}
          >
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.coverAlt ?? ""}
                fill
                priority={priority}
                sizes={lead ? "(max-width: 768px) 100vw, 560px" : "(max-width: 768px) 100vw, 380px"}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-secondary" />
            )}
            {/* Focus ring lives on the image so keyboard users see the target
                without a box drawn around the whole two-column lead layout. */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl ring-brand ring-offset-2 ring-offset-background transition-shadow group-focus-visible:ring-2" />
          </div>

          <div className={lead ? "" : "flex flex-1 flex-col pt-5"}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-eyebrow text-muted-foreground">
              {post.category && <span className="text-brand">{post.category}</span>}
              {post.publishedAt && (
                <time dateTime={isoDate(post.publishedAt)} className="tabular-nums">
                  {formatPostDateShort(post.publishedAt)}
                </time>
              )}
            </div>

            <h3
              className={`mt-3 text-balance font-medium leading-snug tracking-tight text-foreground transition-colors group-hover:text-brand ${
                lead ? "text-2xl sm:text-3xl md:text-4xl" : "text-lg sm:text-xl"
              }`}
            >
              {post.title}
            </h3>

            {post.excerpt && (
              <p
                className={`mt-3 text-muted-foreground ${
                  lead ? "line-clamp-3 text-base sm:text-lg" : "line-clamp-2 text-sm sm:text-base"
                }`}
              >
                {post.excerpt}
              </p>
            )}

            <span className="mt-4 block text-[11px] uppercase tracking-eyebrow text-muted-foreground/80">
              {readTimeLabel(post.readMinutes)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
