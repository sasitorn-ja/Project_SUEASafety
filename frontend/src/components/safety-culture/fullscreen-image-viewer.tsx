"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FullscreenImageViewerPhoto = {
  id: string;
  dataUrl: string;
  type?: string;
};

type FullscreenImageViewerProps = {
  open: boolean;
  photos: FullscreenImageViewerPhoto[];
  index: number;
  alt: string;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
};

export function FullscreenImageViewer({
  open,
  photos,
  index,
  alt,
  onClose,
  onPrevious,
  onNext,
  className,
}: FullscreenImageViewerProps) {
  const currentPhoto = photos[index] || photos[0];
  const hasMultiple = photos.length > 1;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (!hasMultiple) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [hasMultiple, onClose, onNext, onPrevious, open]);

  if (!open || !currentPhoto) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ดูรูปภาพเต็มจอ"
      className={cn("fixed inset-0 z-[100000] flex bg-black text-white", className)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/15 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:top-5"
        aria-label="ปิดภาพเต็ม"
      >
        <X className="h-6 w-6" strokeWidth={2.35} />
      </button>

      {hasMultiple ? (
        <>
          <button
            type="button"
            onClick={onPrevious}
            className="absolute left-2 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/15 transition-all hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5 sm:h-14 sm:w-14"
            aria-label="ดูรูปก่อนหน้า"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={2.45} />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute right-2 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] ring-1 ring-white/15 transition-all hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:h-14 sm:w-14"
            aria-label="ดูรูปถัดไป"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={2.45} />
          </button>
        </>
      ) : null}

      <div
        className="flex h-full w-full items-center justify-center px-0 py-0 sm:px-16 sm:py-10"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {/* Plain img keeps the fullscreen viewer independent of Next image sizing constraints. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentPhoto.dataUrl}
          alt={alt}
          className="max-h-[100dvh] max-w-[100vw] select-none object-contain sm:max-h-[calc(100dvh-80px)] sm:max-w-[calc(100vw-128px)]"
          draggable={false}
          onMouseDown={(event) => event.stopPropagation()}
        />
      </div>

      {hasMultiple ? (
        <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-[13px] font-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] ring-1 ring-white/15 sm:bottom-6">
          {index + 1} / {photos.length}
        </div>
      ) : null}
    </div>
  );
}
