import { db } from "../db";
import { blogPosts, websiteProperties } from "~/server/db/schema";
import { and, asc, desc, eq, lte, or, isNull, ne } from "drizzle-orm";
import { cache } from "react";
import { env } from "~/env";

const ACCOUNT_ID = BigInt(env.NEXT_PUBLIC_ACCOUNT_ID);

/**
 * Page-level blog settings, stored as JSON in `website_config.blog_props`.
 * null column → blog disabled: /blog still renders for anyone holding the URL
 * (so it can be reviewed before launch) but stays noindex and unlinked.
 */
export type BlogProps = {
  /** Master switch. false/undefined → hidden: noindex, out of the sitemap. */
  enabled?: boolean;
  /** Show the blog in the navbar. Only honoured when `enabled` is true. */
  showInMenu?: boolean;
  /** Navbar / breadcrumb label. Default "Blog". */
  menuLabel?: string;
  /** Index-page hero copy. */
  pageTitle?: string;
  pageSubtitle?: string;
  eyebrow?: string;
  /** Hero background. Falls back to the featured post's cover image. */
  heroImage?: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  coverAlt: string | null;
  authorName: string | null;
  authorRole: string | null;
  authorImage: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
  readMinutes: number;
  /** Lecturas acumuladas. Sale del render (ISR), así que puede ir unos minutos
   *  por detrás; el navegador la refresca al sumar la suya. */
  viewCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

/** Average adult reading speed; rounded up so a short post never shows "0 min". */
const WORDS_PER_MINUTE = 200;

function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

type PostRow = typeof blogPosts.$inferSelect;

function toPost(row: PostRow): BlogPost {
  return {
    id: row.postId.toString(),
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.coverImage,
    coverAlt: row.coverAlt,
    authorName: row.authorName,
    authorRole: row.authorRole,
    authorImage: row.authorImage,
    category: row.category,
    tags: parseTags(row.tags),
    featured: row.featured,
    readMinutes: row.readMinutes ?? estimateReadMinutes(row.content),
    viewCount: row.viewCount,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  };
}

export const getBlogProps = cache(
  async (accountIdArg?: bigint): Promise<BlogProps> => {
    "use server";
    try {
      const [config] = await db
        .select({ blogProps: websiteProperties.blogProps })
        .from(websiteProperties)
        .where(eq(websiteProperties.accountId, accountIdArg ?? ACCOUNT_ID))
        .limit(1);

      if (!config?.blogProps) return {};
      const parsed = JSON.parse(config.blogProps) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as BlogProps) : {};
    } catch (error) {
      console.error("Error fetching blog props:", error);
      return {};
    }
  },
);

/**
 * The order the agency set in the website editor. `sort_order` is 0 until
 * somebody drags a card, so an untouched blog keeps listing newest-first —
 * and a freshly written article (also 0) opens at the top rather than behind
 * everything that was already arranged.
 */
const BLOG_ORDER = [
  asc(blogPosts.sortOrder),
  desc(blogPosts.publishedAt),
  desc(blogPosts.postId),
] as const;

/**
 * Only rows that are published AND whose publish date has arrived. A null
 * `published_at` on a published row means "publish immediately", so it counts.
 */
function visibleWhere(accountId: bigint) {
  return and(
    eq(blogPosts.accountId, accountId),
    eq(blogPosts.status, "published"),
    or(isNull(blogPosts.publishedAt), lte(blogPosts.publishedAt, new Date())),
  );
}

export const getBlogPosts = cache(
  async (accountIdArg?: bigint): Promise<BlogPost[]> => {
    "use server";
    try {
      const rows = await db
        .select()
        .from(blogPosts)
        .where(visibleWhere(accountIdArg ?? ACCOUNT_ID))
        .orderBy(...BLOG_ORDER);

      return rows.map(toPost);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      return [];
    }
  },
);

export const getBlogPost = cache(
  async (slug: string, accountIdArg?: bigint): Promise<BlogPost | null> => {
    "use server";
    try {
      const [row] = await db
        .select()
        .from(blogPosts)
        .where(and(visibleWhere(accountIdArg ?? ACCOUNT_ID), eq(blogPosts.slug, slug)))
        .limit(1);

      return row ? toPost(row) : null;
    } catch (error) {
      console.error("Error fetching blog post:", error);
      return null;
    }
  },
);

/**
 * Sidebar / footer of an article: same category first, then most recent.
 * Excludes the post being read.
 */
export const getRelatedPosts = cache(
  async (
    slug: string,
    category: string | null,
    limit = 3,
    accountIdArg?: bigint,
  ): Promise<BlogPost[]> => {
    "use server";
    try {
      const accountId = accountIdArg ?? ACCOUNT_ID;
      const rows = await db
        .select()
        .from(blogPosts)
        .where(and(visibleWhere(accountId), ne(blogPosts.slug, slug)))
        .orderBy(...BLOG_ORDER);

      const posts = rows.map(toPost);
      if (!category) return posts.slice(0, limit);

      const sameCategory = posts.filter((p) => p.category === category);
      const rest = posts.filter((p) => p.category !== category);
      return [...sameCategory, ...rest].slice(0, limit);
    } catch (error) {
      console.error("Error fetching related posts:", error);
      return [];
    }
  },
);
