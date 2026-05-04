import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { PullToRefresh } from "@/components/shop/PullToRefresh";
import { ShopToolbar, SortMode } from "@/components/shop/ShopToolbar";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRICE_MAX_FALLBACK = 10000;

type Product = {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  image_urls: string[] | null;
  category_id: string | null;
  is_active: boolean | null;
  stock_quantity: number;
  sold_count: number;
  created_at: string;
  description: string | null;
  product_code: string;
  sizes: string[] | null;
  categories: { name: string } | null;
};

const Shop = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFromUrl = searchParams.get("category");
  const queryFromUrl = searchParams.get("q") ?? "";
  const sortFromUrl = (searchParams.get("sort") as SortMode) || "newest";
  const inStockFromUrl = searchParams.get("instock") === "1";

  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  const [sort, setSort] = useState<SortMode>(sortFromUrl);
  const [inStockOnly, setInStockOnly] = useState(inStockFromUrl);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, PRICE_MAX_FALLBACK]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  // Compute price max from data once products load
  const priceMax = useMemo(() => {
    if (!products.length) return PRICE_MAX_FALLBACK;
    const max = products.reduce(
      (m, p) => Math.max(m, p.discount_price ?? p.price ?? 0),
      0,
    );
    return Math.max(PRICE_MAX_FALLBACK, Math.ceil(max / 500) * 500);
  }, [products]);

  // Adjust priceRange upper bound when products load (only if user hasn't customized)
  useEffect(() => {
    setPriceRange((curr) => {
      if (curr[1] === PRICE_MAX_FALLBACK || curr[1] === 0) return [curr[0], priceMax];
      return curr;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceMax]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [queryClient]);

  // Filter + sort products
  const filteredProducts = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.categories?.name?.toLowerCase().includes(q),
      );
    }

    result = result.filter((p) => {
      const price = p.discount_price ?? p.price ?? 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (inStockOnly) {
      result = result.filter((p) => (p.stock_quantity ?? 0) > 0);
    }

    const sorted = [...result];
    switch (sort) {
      case "price_asc":
        sorted.sort(
          (a, b) =>
            (a.discount_price ?? a.price) - (b.discount_price ?? b.price),
        );
        break;
      case "price_desc":
        sorted.sort(
          (a, b) =>
            (b.discount_price ?? b.price) - (a.discount_price ?? a.price),
        );
        break;
      case "popular":
        sorted.sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0));
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
    return sorted;
  }, [products, selectedCategory, searchQuery, sort, priceRange, inStockOnly]);

  // URL sync
  const updateUrl = useCallback(
    (next: {
      category?: string | null;
      q?: string | null;
      sort?: SortMode | null;
      instock?: boolean | null;
    }) => {
      const params = new URLSearchParams(searchParams);
      if (next.category !== undefined) {
        if (next.category) params.set("category", next.category);
        else params.delete("category");
      }
      if (next.q !== undefined) {
        if (next.q) params.set("q", next.q);
        else params.delete("q");
      }
      if (next.sort !== undefined) {
        if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
        else params.delete("sort");
      }
      if (next.instock !== undefined) {
        if (next.instock) params.set("instock", "1");
        else params.delete("instock");
      }
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCategoryChange = (id: string | null) => {
    setSelectedCategory(id);
    updateUrl({ category: id });
  };
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    updateUrl({ q });
  };
  const handleSortChange = (s: SortMode) => {
    setSort(s);
    updateUrl({ sort: s });
  };
  const handleInStockToggle = (v: boolean) => {
    setInStockOnly(v);
    updateUrl({ instock: v });
  };

  // Sync state from URL → state when navigating in
  useEffect(() => {
    if (queryFromUrl !== searchQuery) setSearchQuery(queryFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryFromUrl]);
  useEffect(() => {
    if (categoryFromUrl !== selectedCategory) setSelectedCategory(categoryFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFromUrl]);

  const clearAll = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setSort("newest");
    setInStockOnly(false);
    setPriceRange([0, priceMax]);
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  return (
    <Layout>
      <div className="bg-background min-h-screen">
        {/* Header */}
        <div className="bg-gradient-primary text-primary-foreground py-10 md:py-14 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-25 mix-blend-overlay"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 30%, hsl(var(--gold)) 0, transparent 50%)",
            }}
          />
          <div className="relative container mx-auto px-4 text-center">
            <p className="text-[11px] md:text-xs uppercase tracking-[0.3em] text-gold mb-2">
              The Unity Collection
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Our <span className="text-gold">Collection</span>
            </h1>
            <p className="text-primary-foreground/85 mt-2 text-sm md:text-base">
              Premium men&apos;s Punjabi &amp; traditional wear, made in Bangladesh
            </p>
          </div>
        </div>

        <PullToRefresh onRefresh={handleRefresh}>
          <div className="container mx-auto px-4 py-6 md:py-8">
            <ShopToolbar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
              sort={sort}
              onSortChange={handleSortChange}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              inStockOnly={inStockOnly}
              onInStockToggle={handleInStockToggle}
              resultCount={filteredProducts.length}
              priceMax={priceMax}
            />

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 max-w-md mx-auto">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gold-soft/40 flex items-center justify-center">
                  <Inbox className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  No products match your filters
                </h3>
                <p className="text-muted-foreground text-sm mb-5">
                  Try a different category, widen the price range, or clear all filters.
                </p>
                <Button onClick={clearAll} className="rounded-full bg-gradient-gold-strong text-gold-foreground hover:opacity-95">
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>
    </Layout>
  );
};

export default Shop;
