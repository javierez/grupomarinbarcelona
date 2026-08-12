import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Minimal markdown renderer for blog bodies. The editor writes plain markdown,
 * so we support exactly what an agency can produce there — headings, lists,
 * quotes, images, links, emphasis, code and rules — instead of pulling in a
 * full parser. Anything unrecognised renders as a paragraph, never as raw HTML.
 */

type Block =
  | { kind: "heading"; level: 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "image"; src: string; alt: string }
  | { kind: "code"; text: string }
  | { kind: "rule" };

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const ORDERED_ITEM = /^\d+[.)]\s+(.*)$/;
const UNORDERED_ITEM = /^[-*]\s+(.*)$/;

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? "").trim();

    if (line === "") {
      flushParagraph();
      continue;
    }

    if (line.startsWith("```")) {
      flushParagraph();
      const code: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trim().startsWith("```")) {
        code.push(lines[i] ?? "");
        i++;
      }
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph();
      blocks.push({ kind: "rule" });
      continue;
    }

    const imageMatch = IMAGE_LINE.exec(line);
    if (imageMatch) {
      flushParagraph();
      blocks.push({ kind: "image", alt: imageMatch[1] ?? "", src: imageMatch[2] ?? "" });
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      // The post title is the page's h1, so markdown headings start one level
      // down and never go past h4 — deeper nesting isn't useful in an article.
      const hashes = headingMatch[1]?.length ?? 1;
      const level = (Math.min(Math.max(hashes + 1, 2), 4) as 2 | 3 | 4);
      blocks.push({ kind: "heading", level, text: headingMatch[2] ?? "" });
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph();
      const quote: string[] = [line.replace(/^>\s?/, "")];
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim().startsWith(">")) {
        i++;
        quote.push((lines[i] ?? "").trim().replace(/^>\s?/, ""));
      }
      blocks.push({ kind: "quote", text: quote.join(" ").trim() });
      continue;
    }

    const unordered = UNORDERED_ITEM.exec(line);
    const ordered = ORDERED_ITEM.exec(line);
    if (unordered ?? ordered) {
      flushParagraph();
      const isOrdered = !unordered;
      const items: string[] = [(unordered?.[1] ?? ordered?.[1] ?? "").trim()];
      while (i + 1 < lines.length) {
        const next = (lines[i + 1] ?? "").trim();
        const nextItem = isOrdered ? ORDERED_ITEM.exec(next) : UNORDERED_ITEM.exec(next);
        if (!nextItem) break;
        items.push((nextItem[1] ?? "").trim());
        i++;
      }
      blocks.push({ kind: "list", ordered: isOrdered, items });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks;
}

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

/** Bold, italic, inline code and links. Everything else stays literal text. */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(INLINE).filter((part) => part !== "");

  return parts.map((part, index) => {
    const key = `${index}-${part.slice(0, 12)}`;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }

    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = link[2] ?? "#";
      const external = /^https?:\/\//.test(href);
      return (
        <a
          key={key}
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="underline decoration-brand/40 underline-offset-4 transition-colors hover:decoration-brand"
        >
          {link[1]}
        </a>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

const HEADING_CLASSES: Record<2 | 3 | 4, string> = {
  2: "mt-14 scroll-mt-28 text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl",
  3: "mt-10 scroll-mt-28 text-xl font-medium leading-snug tracking-tight text-foreground sm:text-2xl",
  4: "mt-8 scroll-mt-28 text-lg font-medium leading-snug text-foreground",
};

export function ArticleBody({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="text-[1.0625rem] leading-[1.75] text-muted-foreground sm:text-lg sm:leading-[1.8]">
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;

        switch (block.kind) {
          case "heading": {
            const Tag = `h${block.level}` as const;
            return (
              <Tag key={key} className={HEADING_CLASSES[block.level]}>
                {renderInline(block.text)}
              </Tag>
            );
          }
          case "paragraph":
            return (
              <p key={key} className="mt-6">
                {renderInline(block.text)}
              </p>
            );
          case "quote":
            return (
              <blockquote
                key={key}
                className="my-12 border-l-2 border-brand pl-6 font-display text-2xl font-light italic leading-snug text-foreground sm:pl-8 sm:text-3xl"
              >
                {renderInline(block.text)}
              </blockquote>
            );
          case "list":
            return block.ordered ? (
              <ol key={key} className="mt-6 list-decimal space-y-2 pl-6 marker:text-brand">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="pl-1">
                    {renderInline(item)}
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="mt-6 list-disc space-y-2 pl-6 marker:text-brand">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="pl-1">
                    {renderInline(item)}
                  </li>
                ))}
              </ul>
            );
          case "image":
            return (
              <figure key={key} className="my-12">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 760px"
                    unoptimized
                  />
                </div>
                {block.alt && (
                  <figcaption className="mt-3 text-sm text-muted-foreground">
                    {block.alt}
                  </figcaption>
                )}
              </figure>
            );
          case "code":
            return (
              <pre
                key={key}
                className="my-8 overflow-x-auto rounded-xl bg-foreground/[0.04] p-5 font-mono text-sm text-foreground"
              >
                <code>{block.text}</code>
              </pre>
            );
          case "rule":
            return <hr key={key} className="my-12 border-border" />;
        }
      })}
    </div>
  );
}
