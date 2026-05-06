import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { buildProductPath } from "@/lib/slug";

interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  image_urls: string[];
  categories?: { name: string } | null;
  stock_quantity?: number;
  sizes?: string[] | null;
  product_code?: string;
  created_at?: string;
}

interface ProductListItemProps {
  product: Product;
}

const NEW_BADGE_DAYS = 14;

/**
 * Horizontal "list view" tile for the Shop page.  Displays the same
 * product info as <ProductCard /> in a compact two-column row that
 * suits scanning by name + price.
 */
export function ProductListItem({ product }: ProductListItemProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);

  const hasDiscount =
    !!product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const primaryImage = product.image_urls?.[0] || "/placeholder.svg";

  const stockQuantity = product.stock_quantity ?? 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = !isOutOfStock && stockQuantity > 0 && stockQuantity <= 3;

  const isNew =
    !!product.created_at &&
    Date.now() - new Date(product.created_at).getTime() <
      NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;

  const defaultSize = product.sizes?.[0] || "";

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: displayPrice ?? product.price,
      imageUrl: primaryImage,
      size: defaultSize,
      quantity: 1,
      maxStock: stockQuantity,
    });
    setIsAdded(true);
    toast({
      title: "Added to cart",
      description: product.name,
    });
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <Link
      to={buildProductPath(product)}
      className="group flex gap-3 md:gap-4 p-3 md:p-4 bg-card rounded-xl ring-1 ring-border hover:ring-gold/40 hover:shadow-md transition-all"
    >
      <div className="relative shrink-0 w-24 h-28 md:w-32 md:h-36 rounded-lg overflow-hidden bg-muted">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
        {hasDiscount && (
          <Badge className="absolute top-1 left-1 bg-gold text-gold-foreground border-0 text-[10px] px-1.5 py-0">
            -{discountPercent}%
          </Badge>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            {product.categories?.name && (
              <p className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
                {product.categories.name}
              </p>
            )}
            <h3 className="font-display text-base md:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>
          {isNew && !hasDiscount && (
            <Badge className="bg-secondary text-primary-foreground border-0 gap-1 shrink-0">
              <Sparkles className="h-3 w-3" /> New
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base md:text-lg font-bold text-primary">
              ৳{displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs md:text-sm text-muted-foreground line-through">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLowStock && (
              <span className="hidden sm:inline text-[11px] text-amber-700">
                Only {stockQuantity} left
              </span>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleQuickAdd}
              disabled={isOutOfStock}
              className="rounded-full bg-gradient-gold-strong text-gold-foreground hover:opacity-95 px-3"
              aria-label={isAdded ? "Added" : "Add to cart"}
            >
              {isAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              <span className="hidden sm:inline ml-1">
                {isAdded ? "Added" : "Add"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
