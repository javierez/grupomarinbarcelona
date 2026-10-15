"use server";

export type CityFaqItem = { q: string; a: string };

export type CityContent = {
  intro: string;
  faq: CityFaqItem[];
  heroImage?: string;
};

export type CityContentMap = Record<string, CityContent>;

// The `city_content` column was removed from the website_config table in a
// recent schema migration. CityIntro on listing pages renders nothing until /
// if a replacement source is wired up. The function signature is preserved so
// callers can keep awaiting it without changes.
export async function getCityContent(
  _citySlug: string,
): Promise<CityContent | null> {
  return null;
}
