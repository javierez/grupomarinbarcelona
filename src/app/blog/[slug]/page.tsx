import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Footer from "~/components/footer";
import { BlogHero } from "~/components/blog/blog-hero";
import { ArticleBody } from "~/components/blog/article-body";
import { ArticleMetaRail } from "~/components/blog/article-meta-rail";
import { PostCard } from "~/components/blog/post-card";
import {
  getBlogPost,
  getBlogProps,
  getRelatedPosts,
} from "~/server/queries/blog";
import { formatPostDate, isoDate, readTimeLabel } from "~/lib/blog";
import { getSiteUrl } from "~/lib/site-url";
import { ogImageEntry } from "~/lib/og-image";
import { getSiteOgImageSource } from "~/server/queries/og-image";

const baseUrl = getSiteUrl();

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [post, blogProps] = await Promise.all([getBlogPost(slug), getBlogProps()]);

  if (!post) return { title: "Artículo no encontrado" };

  const title = post.seoTitle ?? post.title;
  const description = post.seoDescription ?? post.excerpt ?? undefined;
  const url = `${baseUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: blogProps.enabled
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: isoDate(post.publishedAt),
      modifiedTime: isoDate(post.updatedAt),
      images: [
        ogImageEntry(
          post.coverImage || (await getSiteOgImageSource()),
          post.coverAlt ?? title,
        ),
      ],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const related = await getRelatedPosts(post.slug, post.category);
  const url = `${baseUrl}/blog/${post.slug}`;
  const publishedLabel = formatPostDate(post.publishedAt);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    image: post.coverImage ? [post.coverImage] : undefined,
    datePublished: isoDate(post.publishedAt),
    dateModified: isoDate(post.updatedAt),
    author: post.authorName ? { "@type": "Person", name: post.authorName } : undefined,
    mainEntityOfPage: url,
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <BlogHero
        eyebrow={post.category ?? undefined}
        title={post.title}
        image={post.coverImage}
        imageAlt={post.coverAlt ?? ""}
        meta={[publishedLabel, readTimeLabel(post.readMinutes)].filter(Boolean)}
      />

      <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3">
            <ArticleMetaRail
              slug={post.slug}
              views={post.viewCount}
              date={publishedLabel}
              readTime={readTimeLabel(post.readMinutes)}
              category={post.category}
              authorName={post.authorName}
              authorRole={post.authorRole}
              authorImage={post.authorImage}
              shareUrl={url}
              shareTitle={post.title}
            />
          </div>

          {/* Capped measure: past ~70 characters a line gets hard to track,
              and the 8-column cell is much wider than that on a desktop. */}
          <article className="max-w-[44rem] lg:col-span-8 lg:col-start-5">
            {post.excerpt && (
              <p className="border-l-2 border-brand pl-6 font-display text-2xl font-light italic leading-snug text-foreground sm:text-3xl">
                {post.excerpt}
              </p>
            )}

            <div className={post.excerpt ? "mt-10" : ""}>
              <ArticleBody content={post.content} />
            </div>

            {post.tags.length > 0 && (
              <div className="mt-14 flex flex-wrap gap-2 border-t border-border pt-8">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill border border-border px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <Link
              href="/blog"
              className="mt-14 inline-flex items-center gap-2 text-xs uppercase tracking-eyebrow text-muted-foreground transition-colors hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al blog
            </Link>
          </article>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-20 sm:px-6 sm:py-24">
            <h2 className="text-xs font-medium uppercase tracking-eyebrow text-muted-foreground">
              Seguir leyendo
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
