import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "~/components/footer";
import { BlogHero } from "~/components/blog/blog-hero";
import { PostList } from "~/components/blog/post-list";
import { getBlogPosts, getBlogProps } from "~/server/queries/blog";
import { formatPostDate, readTimeLabel } from "~/lib/blog";
import { getSiteUrl } from "~/lib/site-url";

const baseUrl = getSiteUrl();

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const blogProps = await getBlogProps();
  const title = blogProps.pageTitle ?? "Blog";

  return {
    title,
    description:
      blogProps.pageSubtitle ??
      "Actualidad, guías y análisis del mercado inmobiliario.",
    alternates: { canonical: `${baseUrl}/blog` },
    // Hidden until the account switches the blog on: reachable by URL for
    // review, but never indexed or surfaced in search.
    robots: blogProps.enabled
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function BlogPage() {
  const [blogProps, posts] = await Promise.all([getBlogProps(), getBlogPosts()]);

  // Nothing published yet → 404 rather than an empty shell, so the URL doesn't
  // advertise a blog the agency hasn't written.
  if (posts.length === 0) notFound();

  // The hero is the lead story: the post explicitly marked as featured,
  // otherwise the most recent one.
  const hero = posts.find((post) => post.featured) ?? posts[0]!;
  const rest = posts.filter((post) => post.id !== hero.id);

  return (
    <main className="min-h-screen bg-background">
      <BlogHero
        eyebrow={blogProps.eyebrow ?? hero.category ?? blogProps.pageTitle ?? "Blog"}
        title={hero.title}
        subtitle={hero.excerpt ?? blogProps.pageSubtitle}
        image={hero.coverImage ?? blogProps.heroImage}
        imageAlt={hero.coverAlt ?? ""}
        href={`/blog/${hero.slug}`}
        meta={[
          formatPostDate(hero.publishedAt),
          readTimeLabel(hero.readMinutes),
        ].filter(Boolean)}
      />

      {(blogProps.pageTitle ?? blogProps.pageSubtitle) && (
        <section className="container mx-auto px-4 pt-20 sm:px-6 sm:pt-28">
          <div className="max-w-2xl">
            {blogProps.pageTitle && (
              <h2 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                {blogProps.pageTitle}
              </h2>
            )}
            {blogProps.pageSubtitle && (
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {blogProps.pageSubtitle}
              </p>
            )}
          </div>
        </section>
      )}

      <PostList posts={rest.length > 0 ? rest : posts} />

      <Footer />
    </main>
  );
}
