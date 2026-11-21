import "~/styles/globals.css";

import { type Metadata } from "next";
import { headers } from "next/headers";
import { previewAccountIdFromQuery } from "~/lib/preview-token";
import { ConsentAnalytics } from "~/components/cookie-consent";
import { ThemeProvider } from "~/components/theme-provider";
import { WhatsAppButton } from "~/components/ui/whatsapp-button";
import { CallButton } from "~/components/ui/call-button";
import { toTelHref } from "~/lib/call-number";
import Navbar from "~/components/navbar";
import { HeaderStyleProvider } from "~/components/header-style-context";
import { PageViewBeacon } from "~/components/page-view-beacon";
import { getLogo } from "~/server/queries/logo";
import { getSEOConfig, getFeaturesProps } from "~/server/queries/website-config";
import { getBlogProps } from "~/server/queries/blog";
import { getSocialLinks } from "~/server/queries/social";
import { getContactProps } from "~/server/queries/contact";
import { getAboutProps } from "~/server/queries/about";
import { isAccount129 } from "~/lib/account-overrides/129";
import {
  isAccount137,
  ACCOUNT_137_ACCENT_GREEN,
} from "~/lib/account-overrides/137";
import {
  ACCOUNT_141_OPENAI_PIXEL_ID,
  isAccount141,
} from "~/lib/account-overrides/141";
import { getAccountInfo } from "~/server/queries/account";
import { getColorProps } from "~/server/queries/color";
import { getFontProps } from "~/server/queries/font";
import { allFontVariables } from "~/app/fonts";
import { siteTheme } from "~/lib/theme-style";
import { borradorDeLaPeticion } from "~/server/borrador";
import { BorradorEnVivo } from "~/components/borrador-en-vivo";
import { SeleccionEnVivo } from "~/components/seleccion-en-vivo";
import { env } from "~/env";
import { getSiteUrl } from "~/lib/site-url";
import { siteLanguagesFor } from "~/lib/site-languages";
import { ogImageEntry } from "~/lib/og-image";
import { getSiteOgImageSource } from "~/server/queries/og-image";

export async function generateMetadata(): Promise<Metadata> {
  // Same preview-account resolution as the layout, so the tab title and
  // favicon inside the editor iframe belong to the account being edited.
  const previewAccountId = previewAccountIdFromQuery(
    (await headers()).get("x-preview-qs"),
  );
  const [seoConfig, logoUrl, ogImageSource, borrador, accountInfo] =
    await Promise.all([
      getSEOConfig(previewAccountId),
      getLogo(previewAccountId),
      getSiteOgImageSource(previewAccountId),
      borradorDeLaPeticion(),
      getAccountInfo(previewAccountId?.toString() ?? env.NEXT_PUBLIC_ACCOUNT_ID),
    ]);
  const siteUrl = getSiteUrl();
  // "Aviso Legal | Ana Díaz", as in v1: without the template every subpage's
  // tab and Google title was the bare page name. The home page is the layout's
  // own segment, so the template doesn't touch it.
  // shortName already falls back to the full name (getAccountInfo).
  const brandName = accountInfo?.shortName ?? seoConfig.name;

  // Use the account's own logo as the favicon / search-result icon. Without an
  // explicit `icons` entry Next.js serves the generic default app/favicon.ico
  // (a grey globe), which is what Google shows in search results. Fall back to
  // that default when the account has no logo configured.
  const icon = logoUrl || "/favicon.ico";

  return {
    metadataBase: new URL(siteUrl),
    // Un borrador nunca se indexa (contrato web-por-chat §3).
    ...(borrador ? { robots: { index: false, follow: false } } : {}),
    title: brandName
      ? { default: seoConfig.title, template: `%s | ${brandName}` }
      : seoConfig.title,
    description: seoConfig.description,
    keywords: seoConfig.keywords,
    icons: {
      icon,
      shortcut: icon,
      apple: icon,
    },
    openGraph: {
      title: seoConfig.ogTitle || seoConfig.title,
      description: seoConfig.ogDescription || seoConfig.description,
      url: seoConfig.ogUrl || siteUrl,
      siteName: seoConfig.ogSiteName,
      images: [
        ogImageEntry(
          ogImageSource,
          seoConfig.ogSiteName || seoConfig.name || "Real Estate",
        ),
      ],
      locale: seoConfig.ogLocale || "es_ES",
      type: (seoConfig.ogType || "website") as "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seoConfig.ogTitle || seoConfig.title,
      description: seoConfig.ogDescription || seoConfig.description,
      images: [
        ogImageEntry(
          ogImageSource,
          seoConfig.ogSiteName || seoConfig.name || "Real Estate",
        ),
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "";
  const isPreview = pathname.startsWith("/preview");

  // /preview/* renders an arbitrary account inside the CRM's editor iframe, so
  // the chrome (logo, colours, fonts, navbar, contact) must come from THAT
  // account and not from this deployment's own. undefined on every normal
  // request, which keeps the queries on their existing default.
  const previewAccountId = isPreview
    ? previewAccountIdFromQuery(requestHeaders.get("x-preview-qs"))
    : undefined;

  const [logoUrl, socialLinks, contactProps, accountInfo, colorProps, fontProps, features, aboutProps, seoConfig, blogProps, borrador] = await Promise.all([
    getLogo(previewAccountId),
    getSocialLinks(previewAccountId),
    getContactProps(previewAccountId),
    getAccountInfo(previewAccountId?.toString() ?? env.NEXT_PUBLIC_ACCOUNT_ID),
    getColorProps(previewAccountId),
    getFontProps(previewAccountId),
    getFeaturesProps(previewAccountId),
    getAboutProps(previewAccountId),
    getSEOConfig(previewAccountId),
    getBlogProps(previewAccountId),
    borradorDeLaPeticion(),
  ]);
  // Page availability: explicit features_props flag wins; otherwise fall back to
  // today's behavior (account 129 enriched pages / DB content presence).
  const hasNosotrosPage =
    features.pages?.nosotros ?? (isAccount129(previewAccountId) || !!aboutProps?.originsContent);
  const hasServiciosPage =
    features.pages?.servicios ??
    (isAccount129(previewAccountId) ||
      (!!aboutProps?.extendedServices && aboutProps.extendedServices.length > 0));
  const defaultOffice = contactProps?.offices?.find(office => office.isDefault) || contactProps?.offices?.[0];
  // WhatsApp must use a Spanish MOBILE number (starts with 6 or 7), never a
  // landline (starts with 8/9). Prefer the office's main number, then the sales
  // line; pick the first that is a mobile. Returns wa.me format (34 + 9 digits).
  // whatsappFrom "sales" is the v1 rule: only the default office's sales line.
  const whatsappPhone = (() => {
    const candidates =
      features.whatsappFrom === "sales"
        ? [defaultOffice?.phoneNumbers?.sales]
        : [
            // Explicit WhatsApp number wins, so the WhatsApp line can differ
            // from any single office's displayed phone. Then the default office.
            contactProps?.whatsappNumber,
            defaultOffice?.phoneNumbers?.main,
            defaultOffice?.phoneNumbers?.sales,
          ];
    for (const raw of candidates) {
      const digits = raw?.replace(/\D/g, "") ?? "";
      // Drop Spain's country code to inspect the 9-digit national number.
      const national =
        digits.length === 11 && digits.startsWith("34")
          ? digits.slice(2)
          : digits;
      if (national.length === 9 && /^[67]/.test(national)) {
        return `34${national}`;
      }
    }
    return null;
  })();
  // Botón flotante de llamar: solo si la agencia rellena callNumber.
  const callHref = toTelHref(contactProps?.callNumber);

  // A Google solo en borrador: la web publicada no le pasa la IP de sus visitas.
  const theme = siteTheme(colorProps, fontProps, previewAccountId, {
    googleFonts: Boolean(borrador),
  });
  const rootStyle = theme.vars as React.CSSProperties;

  // GA measurement ID is per-account data: prefer the value stored in the DB
  // (seo_props.gaMeasurementId, which survives regeneration) and fall back to
  // the build-time env var for backward compatibility.
  const gaMeasurementId =
    seoConfig.gaMeasurementId ?? env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // Agencies paste whichever of the two Google gives them. A Tag Manager
  // container is not a measurement id and will not load through <GoogleAnalytics>,
  // so it gets the component that actually knows how to boot it.
  const isTagManager = gaMeasurementId?.toUpperCase().startsWith("GTM-");
  // Pixel de anuncios de ChatGPT: de momento solo Grupo Marín (141).
  const openaiPixelId = isAccount141(previewAccountId)
    ? ACCOUNT_141_OPENAI_PIXEL_ID
    : undefined;

  // El selector de idioma sale si la agencia traduce sus anuncios a algún
  // idioma o tiene el ES/EN de Kit Digital.
  const siteLanguages = siteLanguagesFor({
    accountLanguages: accountInfo?.listingLanguages,
    switcherFlag: features.languageSwitcher === true,
  });

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${allFontVariables} font-sans antialiased${features.siteStyle === "editorial" ? " style-editorial" : ""}${features.aspectoV1 === true ? " aspecto-v1" : ""}`}
        style={rootStyle}
      >
        {theme.googleFontsHref && (
          // Borrador con una familia elegida después del último build.
          <link rel="stylesheet" href={theme.googleFontsHref} precedence="default" />
        )}
        {borrador && (
          <BorradorEnVivo
            token={borrador}
            colors={colorProps}
            fonts={fontProps}
          />
        )}
        {/* Señalar desde «Mi web» (§6.1): nunca en la web que ve una visita. */}
        {(borrador !== null || isPreview) && <SeleccionEnVivo />}
        {(gaMeasurementId ?? openaiPixelId ?? seoConfig.metaPixelId) && (
          <ConsentAnalytics
            tagId={gaMeasurementId}
            isTagManager={isTagManager === true}
            openaiPixelId={openaiPixelId}
            metaPixelId={seoConfig.metaPixelId}
          />
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col overflow-x-hidden">
            <Navbar
              shortName={accountInfo?.shortName || accountInfo?.name || "Inmobiliaria"}
              logoUrl={logoUrl}
              socialLinks={socialLinks}
              primaryColor={colorProps?.primaryColor ?? null}
              promotionsEnabled={features.pages?.promociones === true}
              hasNosotrosPage={hasNosotrosPage}
              hasServiciosPage={hasServiciosPage && features.serviciosInNav !== false}
              contactoInNav={features.contactoInNav}
              enlacesInNav={features.enlacesInNav === true}
              blogInMenu={blogProps.enabled === true && blogProps.showInMenu === true}
              blogLabel={blogProps.menuLabel || undefined}
              menuLabels={features.menuLabels}
              logoSize={features.logoSize}
              navStyle={features.navStyle}
              logoInvertOnLight={features.logoInvertOnLight === true}
              directListingLinks={features.navDirectLinks === true}
              propertyTypes={features.navPropertyTypes}
              referenceSearch={features.referenceSearch !== false}
              navOrder={features.navOrder}
              navExtra={features.navExtra}
              languageSwitcher={siteLanguages.length > 0}
              languages={siteLanguages}
              headerTint={features.headerTint === true}
              navHomeAnchors={features.navHomeAnchors === true}
              navTextoNormal={features.navTextoNormal === true}
              aspectoV1={features.aspectoV1 === true}
              v1Primera={features.v1Primera === true}
              v1Antigua={features.v1Antigua === true}
              v1Inicial={features.v1Inicial === true}
              accountOverrides={{
                is129: isAccount129(previewAccountId),
                showReformas: isAccount141(previewAccountId),
                // "Descubre" feed pill for every account whose featured
                // section runs in feed (TikTok) mode — 155 forces that in code.
                showFeedNav: features.featuredMode === "feed",
                navLinkColor: isAccount137(previewAccountId)
                  ? ACCOUNT_137_ACCENT_GREEN
                  : undefined,
                hideLogoOnMobile: isAccount137(previewAccountId),
              }}
            />
            <HeaderStyleProvider
              minimal={features.headerStyle === "minimal"}
              descriptionAlign={features.descriptionAlign}
              aspectoV1={features.aspectoV1 === true}
              v1Inicial={features.v1Inicial === true}
              cuenta={previewAccountId?.toString()}
            >
              {!isPreview && <PageViewBeacon />}
              {/* v1 (`aspectoV1`): its bar is 72 px, so the page starts 8 px higher. */}
              <main className={`flex-1 ${features.aspectoV1 === true ? "pt-16 sm:pt-[72px]" : "pt-20"}`}>
                {children}
              </main>
            </HeaderStyleProvider>
            {!isPreview && <WhatsAppButton phoneNumber={whatsappPhone} />}
            {!isPreview && (
              <CallButton
                telHref={callHref}
                stackAboveWhatsApp={!!whatsappPhone}
              />
            )}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
