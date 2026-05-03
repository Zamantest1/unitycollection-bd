import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/shop/ProductCard";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { SearchBar } from "@/components/shop/SearchBar";
import { PullToRefresh } from "@/components/shop/PullToRefresh";

const Shop = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  const categoryFromUrl = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [queryClient]);

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.categories?.name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  const activeFilterCount = Number(Boolean(selectedCategory)) + Number(Boolean(searchQuery.trim()));

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      <div className="bg-background min-h-screen">
        <div className="relative overflow-hidden bg-secondary py-10 md:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--gold)/0.24),transparent_34%)]" />
          <div className="relative container mx-auto px-4 text-center">
            <p className="mb-3 inline-flex items-center rounded-full border border-gold/35 bg-primary-foreground/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Premium menswear
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground">
              Our <span className="text-gold">Collection</span>
            </h1>
            <p className="text-primary-foreground/80 mt-3 max-w-2xl mx-auto">
              Discover premium Bangladeshi Punjabi for every occasion
            </p>
          </div>
        </div>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="container mx-auto px-4 py-8 md:py-10">
            <div className="mb-8 rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <SlidersHorizontal className="h-4 w-4 text-gold" />
                    Find your style
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Showing {filteredProducts.length} of {products.length} products
                    {activeFilterCount > 0 ? ` with ${activeFilterCount} active filter${activeFilterCount > 1 ? "s" : ""}` : ""}
                  </p>
                </div>
                {(selectedCategory || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      handleCategoryChange(null);
                    }}
                    className="text-left text-sm font-medium text-primary underline-offset-4 hover:underline md:text-right"
                  >
                    Clear all filters
                  </button>
                )}
              </div>

              <SearchBar value={searchQuery} onChange={setSearchQuery} />

              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategoryChange}
              />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/70 text-center py-16">
                <p className="font-display text-2xl font-semibold text-foreground">No products found</p>
                {(selectedCategory || searchQuery) && (
                  <p className="text-muted text-sm mt-2">
                    Try adjusting your filters or search query
                  </p>
                )}
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </Layout>
  );
};

export default Shop;
