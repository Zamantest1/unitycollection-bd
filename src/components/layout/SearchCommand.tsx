import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Package, Tag, Search as SearchIcon } from "lucide-react";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: products = [] } = useQuery({
    queryKey: ["search-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_urls, price, discount_price, categories(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["search-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  // Cmd/Ctrl+K shortcut for desktop power users.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const close = () => {
    setQuery("");
    onOpenChange(false);
  };

  const submitFreeText = () => {
    if (!query.trim()) return;
    close();
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search Punjabi, Panjabi, kurta…"
        value={query}
        onValueChange={setQuery}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            // Let cmdk handle item-selection first; only fall through when
            // there are no matching items rendered.
            const hasItems = document.querySelector('[cmdk-item][data-selected="true"]');
            if (!hasItems) {
              e.preventDefault();
              submitFreeText();
            }
          }
        }}
      />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center text-sm">
            <p className="text-muted-foreground">No results found.</p>
            {query.trim() && (
              <button
                type="button"
                onClick={submitFreeText}
                className="mt-2 inline-flex items-center gap-1 text-gold hover:underline"
              >
                <SearchIcon className="h-4 w-4" />
                Search shop for "{query.trim()}"
              </button>
            )}
          </div>
        </CommandEmpty>

        {products.length > 0 && (
          <CommandGroup heading="Products">
            {products.slice(0, 8).map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.categories?.name ?? ""}`}
                onSelect={() => {
                  close();
                  navigate(`/product/${p.id}`);
                }}
              >
                {p.image_urls?.[0] ? (
                  <img src={p.image_urls[0]} alt="" className="h-9 w-9 rounded object-cover" />
                ) : (
                  <Package className="h-5 w-5" />
                )}
                <div className="ml-2 flex-1 min-w-0">
                  <div className="truncate text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.categories?.name ?? ""}
                  </div>
                </div>
                <span className="ml-2 text-sm font-semibold text-gold">
                  ৳{(p.discount_price ?? p.price)?.toLocaleString()}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {categories.length > 0 && (
          <CommandGroup heading="Categories">
            {categories.map((c) => (
              <CommandItem
                key={c.id}
                value={`category ${c.name}`}
                onSelect={() => {
                  close();
                  navigate(`/shop?category=${c.id}`);
                }}
              >
                <Tag className="h-4 w-4" />
                <span className="ml-2">{c.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
