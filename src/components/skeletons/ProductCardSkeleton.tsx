import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm animate-fade-in">
      {/* Image skeleton with brand shimmer */}
      <div className="relative aspect-[3/4] bg-gold-soft/30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-soft/50 to-transparent skeleton-shimmer" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-3 md:p-4 space-y-2">
        {/* Category */}
        <Skeleton className="h-3 w-16 bg-gold-soft/40" />
        
        {/* Title */}
        <Skeleton className="h-4 w-3/4 bg-muted" />
        
        {/* Price */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-20 bg-primary/20" />
          <Skeleton className="h-4 w-14 bg-gold-soft/30" />
        </div>
      </div>
    </div>
  );
}
