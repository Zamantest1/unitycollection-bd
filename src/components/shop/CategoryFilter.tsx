import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name
    : null;

  const handleSelect = (categoryId: string | null) => {
    onSelectCategory(categoryId);
    setIsOpen(false); // Auto-close on mobile
  };

  return (
    <div className="mb-6">
      {/* Mobile Toggle */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden w-full justify-between border-border"
      >
        <span>
          {selectedCategoryName ? `Category: ${selectedCategoryName}` : "Filter by Category"}
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Filter Content */}
      <div
        className={cn(
          "md:block",
          isOpen ? "block mt-4" : "hidden"
        )}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleSelect(null)}
            className={cn(
              selectedCategory === null
                ? "bg-primary text-primary-foreground"
                : "border-border hover:border-primary"
            )}
          >
            All Products
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelect(category.id)}
              className={cn(
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              )}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Clear Filter */}
        {selectedCategory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSelect(null)}
            className="mt-3 text-muted hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filter
          </Button>
        )}
      </div>
    </div>
  );
}
