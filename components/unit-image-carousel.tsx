"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitImageCarouselProps {
  images?: string[];
  fallbackImage?: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export default function UnitImageCarousel({ images = [], fallbackImage, alt, className, imageClassName }: UnitImageCarouselProps) {
  const allImages = images.length > 0 ? images : fallbackImage ? [fallbackImage] : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = allImages.length > 1;

  if (allImages.length === 0) {
    return <div className={cn("flex items-center justify-center bg-surface-secondary text-text-tertiary", className)}><Home className="h-12 w-12" /></div>;
  }

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + allImages.length) % allImages.length);
  };

  return (
    <div className={cn("group relative overflow-hidden", className)}>
      <img src={allImages[activeIndex]} alt={alt} className={cn("h-full w-full object-cover transition-transform duration-500 group-hover:scale-105", imageClassName)} />
      {hasMultiple && (
        <>
          <button type="button" aria-label="Previous image" onClick={() => move(-1)} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition-colors hover:bg-black/75"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" aria-label="Next image" onClick={() => move(1)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-lg transition-colors hover:bg-black/75"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/45 px-2 py-1">
            {allImages.map((image, index) => <button type="button" key={`${image}-${index}`} aria-label={`Show image ${index + 1}`} onClick={() => setActiveIndex(index)} className={cn("h-1.5 w-1.5 rounded-full", index === activeIndex ? "bg-white" : "bg-white/45")} />)}
          </div>
        </>
      )}
    </div>
  );
}
