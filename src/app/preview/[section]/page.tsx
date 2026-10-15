import { notFound } from "next/navigation";
import { verifyPreviewToken } from "~/lib/preview-token";
import { getHeroProps, getHeroCities } from "~/server/queries/hero";
import { getLinksProps } from "~/server/queries/website-config";
import { getLogo } from "~/server/queries/logo";
import { getColorProps } from "~/server/queries/color";
import { getFontProps } from "~/server/queries/font";
import {
  getTestimonialProps,
  getTestimonials,
} from "~/server/queries/testimonial";
import { getAboutProps } from "~/server/queries/about";
import { getBlogPosts, getBlogProps } from "~/server/queries/blog";
import { FaqsContent } from "~/app/faqs/faqs-content";
import { ServiciosContent } from "~/app/servicios/servicios-content";
import Footer from "~/components/footer";
import { PreviewBlogClient } from "./preview-blog-client";
import { PreviewHome } from "./preview-home";
import { isInPageSection } from "./preview-sections";
import { PreviewLinksClient } from "./preview-links-client";
import { PreviewSocialClient } from "./preview-social-client";
import { PreviewGlobalsClient } from "./preview-globals-client";
import { PreviewTestimonialsClient } from "./preview-testimonials-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface Props {
  params: Promise<{ section: string }>;
  searchParams: Promise<{
    accountId?: string;
    token?: string;
    exp?: string;
    /** Section to scroll to on first paint, for /preview/home. */
    at?: string;
  }>;
}

export default async function PreviewSectionPage({
  params,
  searchParams,
}: Props) {
  const { section } = await params;
  const sp = await searchParams;
  const accountIdRaw = sp.accountId;
  const token = sp.token;
  const expRaw = sp.exp;

  if (!accountIdRaw || !token || !expRaw) {
    return (
      <PreviewError message="Faltan parámetros (accountId, token, exp)." />
    );
  }

  const exp = Number(expRaw);
  const ok = verifyPreviewToken({ token, accountId: accountIdRaw, exp });
  if (!ok) {
    return <PreviewError message="Token inválido o expirado." />;
  }

  let accountId: bigint;
  try {
    accountId = BigInt(accountIdRaw);
  } catch {
    return <PreviewError message="accountId inválido." />;
  }

  // "home" is the URL the editor actually uses for every homepage section —
  // one iframe, scrolled between sections. The individual section paths stay
  // valid as aliases so "abrir en nueva pestaña" deep-links still work.
  if (section === "home" || isInPageSection(section)) {
    const initial = section === "home" ? (sp.at ?? "hero") : section;
    return <PreviewHome accountId={accountId} section={initial} />;
  }

  switch (section) {
    // Pages of their own on the site. Rendered by calling the real page
    // component with the previewed account, so the preview can't drift from
    // what ships — the alternative was a second copy of each page here.
    case "faqs":
      return <FaqsContent accountId={accountId} live />;
    case "servicios": {
      // The live page 404s when the account has no extended services. Inside a
      // 300px iframe a 404 reads as "the preview is broken", so say what is
      // actually going on instead.
      const about = await getAboutProps(accountId);
      if (!about?.extendedServices?.length) {
        return (
          <PreviewError message="Esta cuenta todavía no tiene servicios configurados, así que la página /servicios no se publica." />
        );
      }
      return <ServiciosContent accountId={accountId} live />;
    }
    case "links": {
      const categories = await getLinksProps(accountId);
      return <PreviewLinksClient initialCategories={categories} />;
    }
    case "blog": {
      const [blogProps, posts] = await Promise.all([
        getBlogProps(accountId),
        getBlogPosts(accountId),
      ]);
      return (
        <PreviewBlogClient
          initialProps={blogProps}
          initialPosts={posts}
          footerSlot={<Footer accountId={accountId} />}
        />
      );
    }
    case "testimonials": {
      const [tprops, tdata] = await Promise.all([
        getTestimonialProps(accountId),
        getTestimonials(accountId),
      ]);
      const mapped = tdata.map((t) => ({
        id: String(t.testimonialId),
        name: t.name ?? "",
        role: t.role ?? "",
        content: t.content ?? "",
        avatar: t.avatar ?? undefined,
        rating: t.rating ?? undefined,
      }));
      return (
        <PreviewTestimonialsClient
          initialProps={tprops}
          testimonials={mapped}
        />
      );
    }
    case "fonts": {
      const [colorProps, fontProps, hero, cities, logo] = await Promise.all([
        getColorProps(accountId),
        getFontProps(accountId),
        getHeroProps(accountId),
        getHeroCities(accountId),
        getLogo(accountId),
      ]);
      return (
        <PreviewGlobalsClient
          initialColors={colorProps}
          initialFonts={fontProps}
          hero={hero}
          cities={cities}
          shortName="Inmobiliaria"
          logoUrl={logo}
          socialLinks={[]}
          promotionsEnabled={false}
        />
      );
    }
    default:
      notFound();
  }
}

function PreviewError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center bg-gray-50 p-6 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}
