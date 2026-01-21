import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Base skeleton component
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Article card skeleton
export function ArticleCardSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <Card className="overflow-hidden border-2">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image skeleton */}
          <Skeleton className="h-64 md:h-80 rounded-none" />

          {/* Content skeleton */}
          <CardContent className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-10 w-full mb-2" />
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 rounded-none" />
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// Articles grid skeleton
export function ArticlesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Timeline skeleton
export function TimelineSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="relative">
      <Skeleton className="absolute left-8 top-0 bottom-0 w-0.5 h-full" />
      <div className="space-y-8">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="relative pl-20">
            <Skeleton className="absolute left-6 top-2 w-5 h-5 rounded-full" />
            <Card>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Skeleton className="h-10 w-16 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </CardContent>
    </Card>
  );
}

// Page loader
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    </div>
  );
}

// Inline spinner
export function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-4",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Chargement"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
}

export { Skeleton };
