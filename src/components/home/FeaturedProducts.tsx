import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function FeaturedProducts() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_featured", true)
        .eq("is_active", true)
        .limit(8);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="relative overflow-hidden py-12 md:py-20 bg-background">
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gold-soft/30 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="relative flex flex-col gap-4 mb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 inline-flex items-center rounded-full bg-gold-soft/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Handpicked styles
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Featured <span className="text-gold">Collection</span>
            </h2>
            <p className="text-muted mt-2">Premium Punjabi designs selected for Eid, Ramadan, weddings, and family occasions.</p>
          </div>
          <Link to="/shop" className="hidden md:block">
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted">
            <p>No featured products yet. Check back soon!</p>
          </div>
        )}

        <Link to="/shop" className="md:hidden mt-6 block">
          <Button className="w-full bg-primary text-primary-foreground">
            View All Products
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
