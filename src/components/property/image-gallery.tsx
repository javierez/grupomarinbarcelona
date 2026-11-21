"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Move, Maximize2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { PropertyImage } from "~/lib/data";
import { isAccount137 } from "~/lib/account-overrides/137";
import { useAspectoV1, useCuenta, useV1Inicial } from "~/components/header-style-context";

interface ImageGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const cuenta = useCuenta();
  // Las webs que vienen de v1 llevan su galería tal cual (flechas, miniaturas, esquinas).
  const v1 = useAspectoV1();
  // La v1 de El Mito (`v1Inicial`): sin pantalla completa ni fondo gris.
  const inicial = useV1Inicial();
  const flecha = v1
    ? "h-10 w-10 rounded-full bg-white/80 hover:bg-white"
    : "h-11 w-11 rounded-full border-0 bg-white/95 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-white hover:scale-105";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loaded, setLoaded] = useState<boolean[]>(() =>
    Array(images.length).fill(false) as boolean[],
  );

  // AI comparison modal state
  const [comparisonModal, setComparisonModal] = useState<{
    isOpen: boolean;
    aiImage: PropertyImage | null;
    originalImage: PropertyImage | null;
  } | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const comparisonContainerRef = useRef<HTMLDivElement | null>(null);

  const validImages = images?.filter((img) => img.url && img.url !== "") || [];
  const defaultPlaceholder = "/suburban-dream.png";

  if (validImages.length === 0) {
    validImages.push({
      url: defaultPlaceholder,
      alt: title || "Property image",
    });
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handleImageLoad = (index: number) => {
    setLoaded((prev) => {
      const newLoaded = [...prev];
      newLoaded[index] = true;
      return newLoaded;
    });
  };

  // When an image fails (403/404), fall back to the original URL.
  // Tracks both main images and thumbnails separately.
  const [urlOverrides, setUrlOverrides] = useState<Record<number, string>>({});
  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});

  const handleImageError = (index: number) => {
    const image = validImages[index];
    if (image?.fallbackUrl && !urlOverrides[index]) {
      setUrlOverrides((prev) => ({ ...prev, [index]: image.fallbackUrl! }));
    }
  };

  const handleThumbError = (index: number) => {
    setThumbErrors((prev) => ({ ...prev, [index]: true }));
    // Also trigger main fallback if not already set
    handleImageError(index);
  };

  const getImageUrl = (image: PropertyImage, index: number): string =>
    urlOverrides[index] ?? image.url ?? "/placeholder.svg";

  /** Use the small thumbnail variant for the strip; fall back to the main URL */
  const getThumbUrl = (image: PropertyImage, index: number): string => {
    // If the thumbUrl already errored, skip it and use the main URL fallback
    if (thumbErrors[index]) return getImageUrl(image, index);
    return image.thumbUrl ?? getImageUrl(image, index);
  };

  // Transform image tags based on AI processing type
  const getDisplayLabel = (tag: string | undefined): string | undefined => {
    if (!tag) return undefined;
    if (tag.startsWith('ai_')) return undefined;
    return tag;
  };

  // Find original image by ID for AI comparison
  const findOriginalImage = (originId: string): PropertyImage | undefined => {
    return images.find(img => img.id === originId);
  };

  const shouldShowAiComparison = (image: PropertyImage): boolean => {
    if (!image.originImageId) return false;
    return true;
  };

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!comparisonContainerRef.current) return;
    const rect = comparisonContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const openComparisonModal = (aiImage: PropertyImage) => {
    if (!aiImage.originImageId) return;
    const original = findOriginalImage(aiImage.originImageId);
    if (original) {
      setComparisonModal({ isOpen: true, aiImage, originalImage: original });
      setSliderPosition(50);
    }
  };

  // Fullscreen: ESC closes, arrows navigate, and body scroll is locked.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
      else if (e.key === "ArrowRight")
        setCurrentIndex((p) => (p === validImages.length - 1 ? 0 : p + 1));
      else if (e.key === "ArrowLeft")
        setCurrentIndex((p) => (p === 0 ? validImages.length - 1 : p - 1));
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen, validImages.length]);

  // Lateral swipe (mobile): drag left → next, drag right → previous.
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || validImages.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    touchStartX.current = null;
    const THRESHOLD = 40;
    if (dx <= -THRESHOLD) handleNext();
    else if (dx >= THRESHOLD) handlePrevious();
  };

  return (
    <div className="space-y-4">
      <div
        className={cn("relative aspect-[16/9] w-full overflow-hidden", !inicial && "bg-muted", v1 ? "rounded-lg" : "rounded-xl")}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {validImages.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              index === currentIndex
                ? "opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            {image.tag === "video" ? (
              <video
                src={image.url}
                controls
                preload="metadata"
                className="h-full w-full object-contain bg-black"
                onLoadedMetadata={() => handleImageLoad(index)}
              />
            ) : (
              <>
                <Image
                  src={getImageUrl(image, index)}
                  alt={image.alt || title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  className={inicial ? "object-cover" : "cursor-zoom-in object-cover"}
                  priority={index === 0}
                  loading={index === 0 ? undefined : "lazy"}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  onClick={inicial ? undefined : () => setIsFullscreen(true)}
                />
                {!loaded[index] && (
                  <div className="absolute inset-0 animate-pulse bg-muted" />
                )}
              </>
            )}

            {/* Regular tag badge (non-AI images only) */}
            {!shouldShowAiComparison(image) && (() => {
              const displayLabel = getDisplayLabel(image.tag);
              return displayLabel && (
                <Badge className={v1 ? "absolute bottom-4 left-4 bg-black/70 text-white" : "absolute bottom-5 left-5 rounded-full border-white/20 bg-black/60 px-3 py-1 text-[11px] font-medium uppercase tracking-eyebrow text-white backdrop-blur-md"}>
                  {displayLabel}
                </Badge>
              );
            })()}
            {/* Compare button for AI images - only when parent image is visible */}
            {shouldShowAiComparison(image) && findOriginalImage(image.originImageId!) && (
              <Button
                size={v1 ? "default" : "pill"}
                className={v1
                  ? "absolute bottom-4 left-1/2 -translate-x-1/2 bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-rose-600 sm:px-6 sm:py-3 sm:text-base"
                  : "absolute bottom-5 left-1/2 -translate-x-1/2 bg-white text-foreground shadow-lg hover:bg-white/90"}
                onClick={() => openComparisonModal(image)}
              >
                <Move className={v1 ? "mr-2 h-5 w-5" : "mr-2 h-4 w-4"} />
                Comparar con original
              </Button>
            )}
          </div>
        ))}

        {validImages.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className={cn("absolute top-1/2 -translate-y-1/2", v1 ? "left-4" : "left-5", flecha)}
              onClick={handlePrevious}
              aria-label="Imagen anterior"
            >
              <ChevronLeft className={v1 ? "h-6 w-6" : "h-5 w-5"} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn("absolute top-1/2 -translate-y-1/2", v1 ? "right-4" : "right-5", flecha)}
              onClick={handleNext}
              aria-label="Imagen siguiente"
            >
              <ChevronRight className={v1 ? "h-6 w-6" : "h-5 w-5"} />
            </Button>
          </>
        )}

        {/* Fullscreen toggle — available even for a single image. */}
        {!inicial && (
        <Button
          variant="outline"
          size="icon"
          className={cn("absolute", v1 ? "right-4 top-4" : "right-5 top-5", flecha)}
          onClick={() => setIsFullscreen(true)}
          aria-label="Ver en pantalla completa"
        >
          <Maximize2 className="h-5 w-5" />
        </Button>
        )}
      </div>

      {validImages.length > 1 && (
        <div className={v1 ? "flex space-x-2 overflow-x-auto pb-2" : "scrollbar-hide flex gap-2 overflow-x-auto pb-2"}>
          {validImages.map((image, index) => (
            <button
              key={index}
              className={cn(
                v1
                  ? "relative flex-shrink-0 overflow-hidden rounded-md border-2"
                  : "group relative flex-shrink-0 overflow-hidden rounded-md transition-all",
                // Ana Díaz (137) keeps v1's large 144px thumbnails.
                isAccount137(cuenta) ? "h-36 w-36" : v1 ? "h-20 w-20" : "h-20 w-24",
                v1
                  ? index === currentIndex ? "border-primary" : "border-transparent"
                  : index === currentIndex
                    ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100",
              )}
              onClick={() => handleThumbnailClick(index)}
              aria-label={`Ver imagen ${index + 1}`}
            >
              {image.tag === "video" ? (
                <div className="relative h-full w-full bg-black">
                  {/* Use the video itself to grab a poster frame */}
                  <video
                    src={`${image.url}#t=0.5`}
                    preload="metadata"
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  {/* Play icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getThumbUrl(image, index)}
                  alt={image.alt || `${title} - Thumbnail ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => handleThumbError(index)}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen viewer — the full image in its real format on a clean
          black backdrop. Swipe laterally on mobile to change photo. */}
      {isFullscreen &&
        (() => {
          const image = validImages[currentIndex];
          if (!image) return null;
          const url = getImageUrl(image, currentIndex);
          return (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {image.tag === "video" ? (
                <video
                  src={url}
                  controls
                  autoPlay
                  className="relative z-10 max-h-[92vh] max-w-[96vw] object-contain"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={url}
                  alt={image.alt || title}
                  className="relative z-10 max-h-[92vh] max-w-[96vw] object-contain"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-20 text-white hover:bg-white/20"
                onClick={() => setIsFullscreen(false)}
                aria-label="Cerrar pantalla completa"
              >
                <X className="h-6 w-6" />
              </Button>

              {validImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    onClick={handlePrevious}
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 z-20 h-11 w-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    onClick={handleNext}
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="h-7 w-7" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
                    {currentIndex + 1} / {validImages.length}
                  </div>
                </>
              )}
            </div>
          );
        })()}

      {/* AI Comparison Modal */}
      {comparisonModal?.isOpen && comparisonModal.aiImage && comparisonModal.originalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
              onClick={() => setComparisonModal(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            <div
              ref={comparisonContainerRef}
              className="relative aspect-[16/9] w-[90vw] max-w-6xl cursor-ew-resize overflow-hidden rounded-lg"
              onMouseMove={(e) => isDragging && updateSliderPosition(e.clientX)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onTouchMove={(e) => isDragging && e.touches[0] && updateSliderPosition(e.touches[0].clientX)}
              onTouchEnd={() => setIsDragging(false)}
            >
              <Image
                src={(() => {
                  const ai = comparisonModal.aiImage;
                  const idx = validImages.findIndex(img => img.id === ai.id);
                  return idx >= 0 ? getImageUrl(ai, idx) : ai.url;
                })()}
                alt="AI Enhanced"
                fill
                className="object-contain"
              />
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <Image
                  src={(() => {
                    const orig = comparisonModal.originalImage;
                    const idx = validImages.findIndex(img => img.id === orig.id);
                    return idx >= 0 ? getImageUrl(orig, idx) : orig.url;
                  })()}
                  alt="Original"
                  fill
                  className="object-contain"
                />
              </div>
              <div
                className="absolute bottom-0 top-0 w-1 bg-white shadow-lg transition-all duration-75 ease-out"
                style={{ left: `${sliderPosition}%` }}
              >
                <div
                  className={cn(
                    "absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border-2 border-border bg-white shadow-xl transition-all duration-200",
                    isDragging && "cursor-grabbing scale-110 border-foreground shadow-2xl"
                  )}
                  onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
                  role="slider"
                  aria-valuenow={sliderPosition}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Arrastrar para comparar"
                >
                  <Move className="h-5 w-5 text-foreground" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 rounded bg-black/70 px-2 py-1 text-sm text-white">
                Original
              </div>
              <div className="absolute bottom-4 right-4 rounded bg-rose-500 px-2 py-1 text-sm text-white">
                Mejorado IA
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
