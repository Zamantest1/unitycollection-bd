import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Star, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "all" | "new" | "sale";

const tabs: { id: Tab; label: string; icon: typeof Star }[] = [
  { id: "all", label: "All", icon: Star },
  { id: "new", label: "New In", icon: Sparkles },
  { id: "sale", label: "On Sale", icon: Tag },
];

export function FeaturedProducts() {
  const [tab, setTab] = useState<Tab>("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_featured", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(16);

      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (tab === "all") return products.slice(0, 8);
    if (tab === "new") {
      const fortnight = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return products
        .filter((p) => new Date(p.created_at).getTime() > fortnight)
        .slice(0, 8);
    }
    if (tab === "sale") {
      return products
        .filter((p) => p.discount_price && p.discount_price < p.price)
        .slice(0, 8);
    }
    return products.slice(0, 8);
  }, [products, tab]);

  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 md:mb-10">
          <div className="text-center md:text-left">
            <p className="text-[11px] md:text-xs uppercase tracking-[0.25em] text-gold mb-1">
              Hand-picked for the modern man
            </p>
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
              Featured <span className="text-gold">Collection</span>
            </h2>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Featured collection filter"
            className="flex items-center gap-1 mx-auto md:mx-0 rounded-full border border-gold/30 bg-card p-1 shadow-sm"
          >
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                    active ? "text-gold-foreground" : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="featured-tab-pill"
                      className="absolute inset-0 rounded-full bg-gradient-gold-strong shadow"
                      transition={{ type: "spring", duration: 0.4 }}
                    />
                  )}
                  <t.icon className="relative h-3.5 w-3.5" />
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-16 text-muted">
            <p>Nothing here yet — try another tab.</p>
          </div>
        )}

        <div className="mt-10 flex items-center justify-center">
          <Link to="/shop">
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-full px-8 group"
            >
              View all products
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
