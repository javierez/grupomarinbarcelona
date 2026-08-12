import { GeistSans } from "geist/font/sans";
import {
  Urbanist,
  Bricolage_Grotesque,
} from "next/font/google";
import type { FontFamilyKey } from "~/lib/data";

const urbanist = Urbanist({ subsets: ["latin"], display: "swap", variable: "--font-urbanist" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });

type FontEntry = { loader: { variable: string; className: string }; cssVar: string };

export const fontCatalog: Partial<Record<FontFamilyKey, FontEntry>> = {
  geist: { loader: GeistSans, cssVar: "var(--font-geist-sans)" },
  urbanist: { loader: urbanist, cssVar: "var(--font-urbanist)" },
  bricolage: { loader: bricolage, cssVar: "var(--font-bricolage)" },
};

export const allFontVariables = Object.values(fontCatalog)
  .filter((entry): entry is FontEntry => Boolean(entry))
  .map((entry) => entry.loader.variable)
  .join(" ");
