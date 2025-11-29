/** @format */

"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Image from "next/image";
import { PostImage } from "@/types/forum";
import { Button } from "@/components/ui/button";

interface PostImagesProps {
  images: PostImage[];
  className?: string;
}

export function PostImages({ images, className = "" }: PostImagesProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [retryingImages, setRetryingImages] = useState<Set<string>>(new Set());

  if (!images || images.length === 0) {
    return null;
  }

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleClose = () => {
    setLightboxOpen(false);
  };

  const handleImageError = (imageId: string) => {
    setFailedImages((prev) => new Set(prev).add(imageId));
  };

  const handleRetry = (imageId: string) => {
    setRetryingImages((prev) => new Set(prev).add(imageId));
    setFailedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(imageId);
      return newSet;
    });
    
    // Reset retrying state after a brief moment
    setTimeout(() => {
      setRetryingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    }, 500);
  };

  const getGridClass = () => {
    const count = images.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count === 3) return "grid-cols-3";
    return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  return (
    <>
      {/* Image Grid */}
      <div className={`grid gap-2 ${getGridClass()} ${className}`}>
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer group"
            onClick={() => !failedImages.has(image.id) && handleImageClick(index)}
          >
            {failedImages.has(image.id) ? (
              // Error state placeholder
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted p-4 text-center">
                <div className="text-muted-foreground text-sm">
                  Failed to load image
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRetry(image.id);
                  }}
                  disabled={retryingImages.has(image.id)}
                  className="min-h-[44px]"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${retryingImages.has(image.id) ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            ) : (
              <Image
                src={image.url || ""}
                alt={image.file_name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
                onError={() => handleImageError(image.id)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={handleClose}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 h-10 w-10 text-white hover:bg-white/20"
            onClick={handleClose}
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 z-10 h-12 w-12 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 z-10 h-12 w-12 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Main image */}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[currentImageIndex].url || ""}
              alt={images[currentImageIndex].file_name}
              width={1200}
              height={1200}
              className="h-auto w-auto max-h-[90vh] max-w-[90vw] object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
