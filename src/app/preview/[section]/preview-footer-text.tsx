"use client";

import { useEffect, useState } from "react";

/** The footer strings the CRM editor can change. */
export type FooterTextField = "companyName" | "description" | "copyright";

interface FooterPatch {
  companyName?: string;
  description?: string;
  copyright?: string;
}

/**
 * One footer string that follows the editor live.
 *
 * The footer is a server component that runs six queries and a good deal of
 * office/link transformation, so it is not worth mirroring as a client
 * component the way the hero or the about section are. Only three of its values
 * are free text an agency edits, and each one is a leaf — so only the leaves
 * become client components, through the `renderText` seam on `<Footer>`.
 */
export function PreviewFooterText({
  field,
  value: initial,
}: {
  field: FooterTextField;
  value: string;
}) {
  const [value, setValue] = useState(initial);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: FooterPatch;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "footer"
      ) {
        return;
      }
      const next = data.patch?.[field];
      // Empty string is a real edit (the agency cleared the box); only an
      // absent key means "this patch doesn't carry that field".
      if (typeof next === "string") setValue(next);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [field]);

  return <>{value}</>;
}
