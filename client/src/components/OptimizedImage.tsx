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
  /** How the image should fit within its container (default: "cover") */
  objectFit?: "contain" | "cover" | "fill" | "none";
  /** Position of the image within its container (default: "center") */
  objectPosition?: string;
}

// Default sizes for responsive images
const DEFAULT_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dglxf0y5i';

/**
 * Optimize image URL using Cloudinary
 * @param src - Original image URL
 * @param width - Target width in pixels
 * @param quality - Image quality (1-100), default 80
 * @returns Optimized Cloudinary URL or original URL if local
 */
function optimizeImageUrl(src: string, width: number, quality: number = 80): string {
  // Skip optimization for local images (relative paths or data URLs)
  if (!src || src.startsWith('/') || src.startsWith('data:')) {
    return src;
  }
  
  // Only optimize external URLs (http:// or https://)
  if (src.startsWith('http://') || src.startsWith('https://')) {
    // Cloudinary fetch API with automatic format and quality optimization
    const cloudinaryUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/f_auto,q_${quality},w_${width},c_limit/${encodeURIComponent(src)}`;
    return cloudinaryUrl;
  }
  
  // Return original URL for any other case
  return src;
}

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
  objectFit = "cover",
  objectPosition = "center",
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

  // For object-fit: contain, we want the wrapper to fill the parent and center the image inside
  const isContain = objectFit === "contain";
  
  const wrapperStyle = { 
    width: width ? `${width}px` : "100%", 
    height: height ? `${height}px` : "100%",
    // Don't apply aspectRatio when contain mode - let parent control dimensions
    ...(isContain ? {} : aspectRatioStyle)
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        placeholder === "blur" && !isLoaded && "bg-muted animate-pulse",
        // Add flex centering when using contain mode
        isContain && "flex items-center justify-center",
        className
      )}
      style={wrapperStyle}
    >
      {shouldLoad && (
        /* Image optimized via Cloudinary (automatic WebP/AVIF conversion, compression, and resizing) */
        <img
          src={optimizeImageUrl(imageSrc, defaultWidth)}
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
            "transition-opacity duration-300",
            // For contain mode: use max-w/max-h to fit within container while allowing centering
            // For other modes: fill the container
            isContain ? "max-w-full max-h-full" : "w-full h-full",
            objectFit === "contain" && "object-contain",
            objectFit === "cover" && "object-cover",
            objectFit === "fill" && "object-fill",
            objectFit === "none" && "object-none",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            // Ensure explicit dimensions to prevent CLS
            aspectRatio: aspectRatio || undefined,
            objectPosition: objectPosition,
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
