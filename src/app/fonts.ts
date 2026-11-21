import { GeistSans } from "geist/font/sans";
import {
  Cormorant_Garamond,
  Urbanist,
  Bricolage_Grotesque,
} from "next/font/google";
import type { FontFamilyKey } from "~/lib/data";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", variable: "--font-cormorant", weight: ["300", "400", "500", "600", "700"] });
const urbanist = Urbanist({ subsets: ["latin"], display: "swap", variable: "--font-urbanist" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });

type FontEntry = { loader: { variable: string; className: string }; cssVar: string };

export const fontCatalog: Partial<Record<FontFamilyKey, FontEntry>> = {
  geist: { loader: GeistSans, cssVar: "var(--font-geist-sans)" },
  cormorant: { loader: cormorant, cssVar: "var(--font-cormorant)" },
  urbanist: { loader: urbanist, cssVar: "var(--font-urbanist)" },
  bricolage: { loader: bricolage, cssVar: "var(--font-bricolage)" },
};

export const builtFonts: { sansFamily: FontFamilyKey; headingFamily: FontFamilyKey } = {
  sansFamily: "urbanist",
  headingFamily: "bricolage",
};

export const allFontVariables = Object.values(fontCatalog)
  .filter((entry): entry is FontEntry => Boolean(entry))
  .map((entry) => entry.loader.variable)
  .join(" ");
