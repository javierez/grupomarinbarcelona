/**
 * Lightweight rich renderer for About text stored in website_config.
 *
 * Formats plain-ish text into paragraphs, headings and lists WITHOUT a markdown
 * dependency. Conventions:
 *   - blocks separated by a blank line            → paragraphs
 *   - lines starting with "* " / "- " / "• "       → list
 *   - a short line ending with "?"                → eyebrow subheading
 *   - a line ending with ":" before a list        → section heading
 *   - 2–4 "Label: text" items                      → a responsive column grid
 *     (accent bar + bold label + description) for strong visual hierarchy
 *   - other "Label: text" items                    → bold label inline
 *
 * Backward-compatible: text with no newlines and no bullet markers renders as a
 * single paragraph, so existing accounts are unaffected.
 */

import { cn } from "~/lib/utils";
import {
  type DescriptionAlign,
  descriptionAlignClass,
} from "~/lib/description-align";
import { isAccount139 } from "~/lib/account-overrides/139";

const BULLET_RE = /^\s*[*\-•]\s+/;
const LABEL_RE = /^([\p{L}\s]{2,30}):\s*(.+)$/u;
const isBullet = (l: string) => BULLET_RE.test(l);
const stripBullet = (l: string) => l.replace(BULLET_RE, "").trim();

interface Labeled {
  label: string;
  text: string;
}

export function RichAboutText({
  text,
  paragraphClassName = "text-base leading-relaxed text-foreground/80 sm:text-lg",
  align,
}: {
  text: string;
  paragraphClassName?: string;
  align?: DescriptionAlign;
}) {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return null;
  const pClass = cn(paragraphClassName, descriptionAlignClass(align));
  // Account 139: tighter spacing between paragraphs/blocks.
  const tight = isAccount139();

  // Plain prose (no structure) → single paragraph, exactly as before.
  if (!trimmed.includes("\n") && !BULLET_RE.test(trimmed)) {
    return <p className={pClass}>{trimmed}</p>;
  }

  const blocks = trimmed.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className={tight ? "space-y-4" : "space-y-6"}>
      {blocks.map((block, bi) => {
        const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const firstBullet = lines.findIndex(isBullet);
        const leadLines = firstBullet === -1 ? lines : lines.slice(0, firstBullet);
        const bullets =
          firstBullet === -1 ? [] : lines.slice(firstBullet).filter(isBullet);

        // Parse "Label: text" items.
        const pillars: Labeled[] = [];
        let allLabeled = bullets.length > 0;
        for (const b of bullets) {
          const m = LABEL_RE.exec(stripBullet(b));
          if (m?.[1] && m[2]) pillars.push({ label: m[1].trim(), text: m[2].trim() });
          else allLabeled = false;
        }
        const asGrid = allLabeled && bullets.length >= 2 && bullets.length <= 4;

        return (
          <div key={bi} className={tight ? "space-y-3" : "space-y-4"}>
            {leadLines.map((line, li) => {
              if (line.endsWith("?") && line.length < 70) {
                return (
                  <h4
                    key={li}
                    className="text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground"
                  >
                    {line}
                  </h4>
                );
              }
              if (line.endsWith(":") && bullets.length > 0) {
                return (
                  <h3
                    key={li}
                    className="text-lg font-semibold text-foreground sm:text-xl"
                  >
                    {line.replace(/:\s*$/, "")}
                  </h3>
                );
              }
              return (
                <p key={li} className={pClass}>
                  {line}
                </p>
              );
            })}

            {asGrid ? (
              <div className="grid gap-6 pt-1 sm:grid-cols-2 lg:grid-cols-3">
                {pillars.map((p, li) => (
                  <div key={li} className="space-y-2">
                    <div className="h-0.5 w-8 rounded-full bg-brand" />
                    <h4 className="text-base font-semibold text-foreground sm:text-lg">
                      {p.label}
                    </h4>
                    <p className="text-sm leading-relaxed text-foreground/70 sm:text-base">
                      {p.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : bullets.length > 0 ? (
              <ul className="space-y-2">
                {bullets.map((b, li) => {
                  const m = LABEL_RE.exec(stripBullet(b));
                  return (
                    <li
                      key={li}
                      className="flex gap-2.5 text-base leading-relaxed text-foreground/80 sm:text-lg"
                    >
                      <span className="mt-2.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                      <span>
                        {m?.[1] && m[2] ? (
                          <>
                            <strong className="font-semibold text-foreground">
                              {m[1]}:
                            </strong>{" "}
                            {m[2]}
                          </>
                        ) : (
                          stripBullet(b).replace(/\s*\.\s*$/, "")
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
