import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ShieldCheck, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BannerSkeleton } from "@/components/skeletons/BannerSkeleton";

export function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const getOverlayClass = (overlayType: string | null) => {
    if (overlayType === "gold") {
      return "bg-gradient-to-r from-gold/75 via-secondary/45 to-secondary/20";
    }

    if (overlayType === "none") {
      return "bg-gradient-to-r from-black/55 via-black/30 to-black/10";
    }

    return "bg-gradient-to-r from-secondary/90 via-secondary/55 to-secondary/20";
  };

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    if (isSwipe && banners.length > 1) {
      if (distance > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (isLoading) {
    return <BannerSkeleton />;
  }

  if (banners.length === 0) {
    return (
      <section className="relative min-h-[540px] overflow-hidden bg-gradient-to-br from-primary via-secondary to-primary flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--gold)/0.28),transparent_34%),radial-gradient(circle_at_bottom_right,hsl(var(--gold-soft)/0.24),transparent_30%)]" />
        <div className="relative text-center text-primary-foreground px-4">
          <p className="mx-auto mb-4 inline-flex items-center rounded-full border border-gold/30 bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-gold backdrop-blur">
            Premium Eid & festive Punjabi collection
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Premium <span className="text-gold">Punjabi</span> Collection
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Discover elegant traditional Bangladeshi clothing for every occasion
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/shop">
              <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-xl shadow-gold/20">
                Shop Now
              </Button>
            </Link>
            <Link to="/categories">
              <Button size="lg" variant="outline" className="border-primary-foreground/35 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Browse Categories
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/85">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur">
              <Truck className="h-4 w-4 text-gold" />
              Fast Rajshahi delivery
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-gold" />
              Quality assured
            </span>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentSlide];

  return (
    <section 
      className="relative min-h-[540px] overflow-hidden touch-pan-y md:min-h-[660px]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentBanner.image_url})` }}
          >
            <div className={`absolute inset-0 ${getOverlayClass(currentBanner.overlay_type)}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--gold)/0.22),transparent_30%)]" />
          </div>
          
          <div className="relative h-full min-h-[540px] container mx-auto flex items-center justify-center px-6 py-16 md:min-h-[660px] md:justify-start md:px-4">
            <div className="max-w-2xl text-center md:text-left">
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="mb-4 inline-flex items-center rounded-full border border-gold/35 bg-primary-foreground/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur"
              >
                Unity Collection
              </motion.p>
              {currentBanner.title && (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-3xl sm:text-4xl md:text-6xl font-bold text-primary-foreground mb-4 leading-tight drop-shadow"
                >
                  {currentBanner.title}
                </motion.h1>
              )}
              {currentBanner.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mx-auto max-w-xl text-base sm:text-lg md:text-xl text-primary-foreground/90 mb-6 md:mx-0"
                >
                  {currentBanner.subtitle}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col justify-center gap-3 sm:flex-row md:justify-start"
              >
                {currentBanner.link && (
                  <Link to={currentBanner.link}>
                    <Button size="lg" className="w-full bg-gold text-gold-foreground hover:bg-gold/90 shadow-xl shadow-gold/20 sm:w-auto">
                      Shop Now
                    </Button>
                  </Link>
                )}
                <Link to="/categories">
                  <Button size="lg" variant="outline" className="w-full border-primary-foreground/35 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground hover:text-primary sm:w-auto">
                    Explore Categories
                  </Button>
                </Link>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/85 md:justify-start"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur">
                  <Truck className="h-4 w-4 text-gold" />
                  Fast delivery
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  Premium fabric
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-primary-foreground/30 md:left-6"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground shadow-lg backdrop-blur-sm transition-colors hover:bg-primary-foreground/30 md:right-6"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-primary-foreground/15 bg-secondary/30 px-3 py-2 backdrop-blur">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === currentSlide ? "w-8 bg-gold" : "w-2.5 bg-primary-foreground/55 hover:bg-primary-foreground/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
