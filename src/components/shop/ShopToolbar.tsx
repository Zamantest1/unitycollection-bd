import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SortMode = "newest" | "price_asc" | "price_desc" | "popular";

const sortOptions: { id: SortMode; label: string }[] = [
  { id: "newest", label: "Newest first" },
  { id: "popular", label: "Most popular" },
  { id: "price_asc", label: "Price · Low to High" },
  { id: "price_desc", label: "Price · High to Low" },
];

interface ShopToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  sort: SortMode;
  onSortChange: (sort: SortMode) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  inStockOnly: boolean;
  onInStockToggle: (value: boolean) => void;
  resultCount: number;
  priceMax: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

/**
 * Sticky toolbar for the Shop page.
 * Combines search, sort, and a sheet-based filter drawer that holds
 * category pills, price range slider, and "in stock only".
 */
export function ShopToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  sort,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  inStockOnly,
  onInStockToggle,
  resultCount,
  priceMax,
  viewMode,
  onViewModeChange,
}: ShopToolbarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const activeFilters = [
    selectedCategory ? 1 : 0,
    inStockOnly ? 1 : 0,
    priceRange[0] > 0 || priceRange[1] < priceMax ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    onSelectCategory(null);
    onInStockToggle(false);
    onPriceRangeChange([0, priceMax]);
  };

  return (
    <div className="sticky top-16 md:top-20 z-20 bg-background/95 backdrop-blur-md border-b border-gold/15 -mx-4 px-4 py-3 md:py-4 mb-6">
      <div className="flex flex-col gap-3">
        {/* Top row — search */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search Punjabi, kurta, fabric…"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-9 h-10 md:h-11 rounded-full bg-card border-gold/20 focus-visible:ring-2 focus-visible:ring-gold focus-visible:border-gold"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-10 md:h-11 rounded-full border-gold/30 hover:border-gold hover:bg-gold/10 gap-2 px-4"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilters > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-gold text-gold-foreground text-[10px] flex items-center justify-center border-0">
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
              <SheetHeader className="border-b px-5 py-4">
                <SheetTitle className="font-display text-lg">Filters</SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
                {/* Categories */}
                <section>
                  <h3 className="font-display text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
                    Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      label="All"
                      active={selectedCategory === null}
                      onClick={() => onSelectCategory(null)}
                    />
                    {categories.map((c) => (
                      <FilterChip
                        key={c.id}
                        label={c.name}
                        active={selectedCategory === c.id}
                        onClick={() => onSelectCategory(c.id)}
                      />
                    ))}
                  </div>
                </section>

                {/* Price range */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Price range
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      ৳{priceRange[0].toLocaleString()} – ৳{priceRange[1].toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={priceMax}
                    step={50}
                    value={priceRange}
                    onValueChange={(v) =>
                      onPriceRangeChange([v[0] ?? 0, v[1] ?? priceMax] as [number, number])
                    }
                    className="my-2"
                  />
                </section>

                {/* In stock only */}
                <section className="flex items-center justify-between rounded-xl border border-border p-3">
                  <div>
                    <Label htmlFor="in-stock" className="font-medium">
                      In stock only
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Hide sold-out products
                    </p>
                  </div>
                  <Switch id="in-stock" checked={inStockOnly} onCheckedChange={onInStockToggle} />
                </section>
              </div>

              <SheetFooter className="border-t px-5 py-3 flex-row gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1 rounded-full"
                >
                  Reset
                </Button>
                <SheetClose asChild>
                  <Button className="flex-1 rounded-full bg-gradient-gold-strong text-gold-foreground hover:opacity-95">
                    Show {resultCount} results
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Bottom row — sort + active filters */}
        <div className="flex items-center justify-between gap-2 -mt-1">
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {resultCount} {resultCount === 1 ? "product" : "products"}
            </span>
            {selectedCategory && (
              <ActiveChip
                label={categories.find((c) => c.id === selectedCategory)?.name ?? "Category"}
                onClear={() => onSelectCategory(null)}
              />
            )}
            {inStockOnly && (
              <ActiveChip label="In stock" onClear={() => onInStockToggle(false)} />
            )}
            {(priceRange[0] > 0 || priceRange[1] < priceMax) && (
              <ActiveChip
                label={`৳${priceRange[0]} – ৳${priceRange[1]}`}
                onClear={() => onPriceRangeChange([0, priceMax])}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="View mode"
              className="inline-flex items-center rounded-full border border-gold/30 bg-card p-0.5"
            >
              <button
                type="button"
                onClick={() => onViewModeChange("grid")}
                aria-pressed={viewMode === "grid"}
                aria-label="Grid view"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                aria-pressed={viewMode === "list"}
                aria-label="List view"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Select value={sort} onValueChange={(v) => onSortChange(v as SortMode)}>
              <SelectTrigger className="h-9 w-auto min-w-[140px] rounded-full border-gold/30 hover:border-gold gap-1.5 text-sm">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {sortOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:border-primary",
      )}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 text-foreground border border-gold/40 pl-2.5 pr-1 py-0.5 text-[11px] whitespace-nowrap">
      {label}
      <button
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-gold/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
