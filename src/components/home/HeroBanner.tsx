import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  // Touch handlers for swipe gestures
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
        // Swiped left - go to next slide
        nextSlide();
      } else {
        // Swiped right - go to previous slide
        prevSlide();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Show skeleton while loading
  if (isLoading) {
    return <BannerSkeleton />;
  }

  // Fallback banner if no banners in database
  if (banners.length === 0) {
    return (
      <section className="relative h-[50vh] md:h-[70vh] bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="text-center text-primary-foreground px-4">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
            Premium <span className="text-gold">Punjabi</span> Collection
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Discover elegant traditional Bangladeshi clothing for every occasion
          </p>
          <Link to="/shop">
            <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              Shop Now
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentSlide];

  return (
    <section 
      className="relative h-[50vh] md:h-[70vh] overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentBanner.image_url})` }}
          >
            {/* Dynamic overlay based on overlay_type */}
            <div className={`absolute inset-0 ${
              (currentBanner as any).overlay_type === 'gold' 
                ? 'bg-gradient-to-r from-gold/70 to-gold/30'
                : (currentBanner as any).overlay_type === 'none'
                ? 'bg-gradient-to-r from-black/50 to-black/20'
                : 'bg-gradient-to-r from-secondary/80 to-secondary/40'
            }`} />
          </div>
          
          <div className="relative h-full container mx-auto px-12 md:px-4 flex items-center justify-center md:justify-start">
            <div className="max-w-xl text-center md:text-left">
              {currentBanner.title && (
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-primary-foreground mb-3 md:mb-4 leading-tight"
                >
                  {currentBanner.title}
                </motion.h1>
              )}
              {currentBanner.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm sm:text-base md:text-xl text-primary-foreground/90 mb-4 md:mb-6 px-4 md:px-0"
                >
                  {currentBanner.subtitle}
                </motion.p>
              )}
              {currentBanner.link && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center md:justify-start"
                >
                  <Link to={currentBanner.link}>
                    <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
                      Shop Now
                    </Button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/30 transition-colors flex items-center justify-center"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground hover:bg-primary-foreground/30 transition-colors flex items-center justify-center"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? "bg-gold" : "bg-primary-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
