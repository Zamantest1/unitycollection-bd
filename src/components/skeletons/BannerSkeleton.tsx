export function BannerSkeleton() {
  return (
    <section className="relative h-[50vh] md:h-[70vh] bg-gradient-to-br from-secondary to-primary overflow-hidden">
      {/* Animated shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-soft/10 to-transparent skeleton-shimmer" />
      
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="max-w-xl space-y-4">
          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-10 md:h-14 w-64 md:w-96 bg-primary-foreground/10 rounded-lg animate-pulse" />
            <div className="h-10 md:h-14 w-48 md:w-72 bg-gold/20 rounded-lg animate-pulse" />
          </div>
          
          {/* Subtitle skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-5 md:h-6 w-80 md:w-[28rem] bg-primary-foreground/10 rounded animate-pulse" />
            <div className="h-5 md:h-6 w-64 md:w-80 bg-primary-foreground/10 rounded animate-pulse" />
          </div>
          
          {/* Button skeleton */}
          <div className="pt-4">
            <div className="h-12 w-36 bg-gold/30 rounded-md animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Dots skeleton */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${i === 0 ? "bg-gold/60" : "bg-primary-foreground/30"}`}
          />
        ))}
      </div>
    </section>
  );
}
