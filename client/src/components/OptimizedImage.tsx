import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  aspectRatio?: "16/9" | "4/3" | "1/1" | "3/2" | "2/3" | string;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  fallbackSrc?: string;
  sizes?: string;
  srcSet?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Default sizes for responsive images
const DEFAULT_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

/**
 * Optimized Image component with:
 * - Native lazy loading
 * - Intersection Observer for better control
 * - Blur placeholder effect
 * - Error handling with fallback
 * - Fade-in animation on load
 * - Aspect ratio support to prevent CLS
 * - srcset and sizes support for responsive images
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  aspectRatio = "16/9",
  priority = false,
  placeholder = "blur",
  fallbackSrc = "/placeholder-image.svg",
  sizes = DEFAULT_SIZES,
  srcSet,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use Intersection Observer for non-priority images
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallbackSrc : src;
  const shouldLoad = priority || isInView;

  // Calculate default dimensions if not provided (for CLS prevention)
  const defaultWidth = width || 1200;
  const defaultHeight = height || (aspectRatio === "16/9" ? 675 : aspectRatio === "4/3" ? 900 : 1200);

  // Compute aspect ratio style for container
  const aspectRatioStyle = aspectRatio ? { aspectRatio } : {};

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        placeholder === "blur" && !isLoaded && "bg-muted animate-pulse",
        className
      )}
      style={{ 
        width: width ? `${width}px` : "100%", 
        height: height ? `${height}px` : undefined,
        ...aspectRatioStyle
      }}
    >
      {shouldLoad && (
        <img
          src={imageSrc}
          alt={alt}
          width={defaultWidth}
          height={defaultHeight}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          sizes={sizes}
          srcSet={srcSet}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            // Ensure explicit dimensions to prevent CLS
            aspectRatio: aspectRatio || undefined,
          }}
        />
      )}
      
      {/* Placeholder skeleton while loading */}
      {!isLoaded && placeholder === "blur" && (
        <div
          className="absolute inset-0 bg-muted"
          aria-hidden="true"
          style={aspectRatioStyle}
        />
      )}
    </div>
  );
}

/**
 * Preload an image programmatically
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Hook for preloading images
 */
export function useImagePreload(srcs: string[]) {
  useEffect(() => {
    srcs.forEach((src) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);
    });
  }, [srcs]);
}
