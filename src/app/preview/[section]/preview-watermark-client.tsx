"use client";

import { useEffect, useState } from "react";

interface WatermarkProps {
  enabled?: boolean;
  position?: string; // northeast | northwest | southeast | southwest | center
  sizePercentage?: number; // 5–60
  opacity?: number; // 0–1
  logoUrl?: string;
}

// A neutral stock-ish photo for the demo. If account has a hero image, that
// would be more representative — keeping things simple.
const SAMPLE_IMAGE =
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80";

const POSITION_CLASS: Record<string, string> = {
  northeast: "top-3 right-3",
  northwest: "top-3 left-3",
  southeast: "bottom-3 right-3",
  southwest: "bottom-3 left-3",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function PreviewWatermarkClient({
  initialProps,
  logoUrl,
}: {
  initialProps: WatermarkProps;
  logoUrl: string;
}) {
  const [props, setProps] = useState<WatermarkProps>(initialProps);

  useEffect(() => {
    window.parent.postMessage({ type: "vesta:preview-ready" }, "*");
    const onMessage = (e: MessageEvent) => {
      const data = e.data as {
        type?: string;
        section?: string;
        patch?: WatermarkProps;
      } | null;
      if (
        !data ||
        typeof data !== "object" ||
        data.type !== "vesta:preview" ||
        data.section !== "watermark"
      )
        return;
      setProps((prev) => ({ ...prev, ...(data.patch ?? {}) }));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const enabled = props.enabled ?? false;
  const position = props.position ?? "southeast";
  const sizePct = Math.max(5, Math.min(60, props.sizePercentage ?? 30));
  const opacity = Math.max(0, Math.min(1, props.opacity ?? 0.8));
  const positionClass = POSITION_CLASS[position] ?? POSITION_CLASS.southeast;
  const watermarkSrc = props.logoUrl || logoUrl;

  return (
    <div className="flex flex-col items-center gap-6 px-6 py-12">
      <p className="text-sm text-muted-foreground">
        Vista previa de la marca de agua sobre una foto de propiedad
      </p>
      <div className="relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SAMPLE_IMAGE} alt="" className="h-full w-full object-cover" />
        {enabled && watermarkSrc && (
          <div
            className={`pointer-events-none absolute ${positionClass}`}
            style={{ width: `${sizePct}%`, opacity }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={watermarkSrc}
              alt=""
              className="h-auto w-full object-contain"
            />
          </div>
        )}
        {!enabled && (
          <div className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
            (Marca de agua desactivada)
          </div>
        )}
      </div>
    </div>
  );
}
