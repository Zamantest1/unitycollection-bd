import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

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

interface ProductCardProps {
  product: Product;
}

const NEW_BADGE_DAYS = 14;

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasDiscount =
    !!product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const primaryImage = product.image_urls?.[0] || "/placeholder.svg";
  const secondaryImage = product.image_urls?.[1];

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
      price: displayPrice || product.price,
      originalPrice: product.price,
      size: defaultSize,
      imageUrl: primaryImage,
      quantity: 1,
      stockQuantity,
      productCode: product.product_code,
    });

    setIsAdded(true);
    toast({
      title: "Added to cart",
      description: `${product.name}${defaultSize ? ` · ${defaultSize}` : ""}`,
    });

    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="block group bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl ring-1 ring-transparent hover:ring-gold/30 transition-all"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}

          {/* Primary image */}
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
              isOutOfStock ? "opacity-60" : ""
            } ${imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"} ${
              secondaryImage ? "group-hover:opacity-0" : "group-hover:scale-105"
            }`}
          />

          {/* Secondary image — fades in on hover for a richer feel */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 items-start">
            {hasDiscount && !isOutOfStock && (
              <Badge className="bg-gold text-gold-foreground border-0 shadow-sm">
                −{discountPercent}%
              </Badge>
            )}
            {isNew && !isOutOfStock && (
              <Badge className="bg-gradient-primary text-primary-foreground border-0 shadow-sm inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> New
              </Badge>
            )}
            {isLowStock && (
              <Badge variant="outline" className="bg-card/80 backdrop-blur-sm text-destructive border-destructive/40 shadow-sm">
                Only {stockQuantity} left
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="shadow-sm">
                Sold Out
              </Badge>
            )}
          </div>

          {/* Quick Add */}
          {!isOutOfStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
            >
              <Button
                size="icon"
                onClick={handleQuickAdd}
                aria-label={isAdded ? "Added to cart" : "Quick add to cart"}
                className={`h-10 w-10 rounded-full shadow-md transition-all focus-visible:ring-2 focus-visible:ring-gold ${
                  isAdded
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gold hover:bg-gold/90"
                } text-white`}
              >
                {isAdded ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 md:p-4">
          <div className="flex items-center justify-between gap-2 mb-1">
            {product.categories?.name ? (
              <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-[0.18em] truncate">
                {product.categories.name}
              </p>
            ) : (
              <span />
            )}
            {product.product_code && (
              <p className="text-[10px] text-muted-foreground/70 font-mono shrink-0">
                {product.product_code}
              </p>
            )}
          </div>

          <h3
            className={`font-display font-semibold text-sm md:text-base line-clamp-2 transition-colors leading-snug ${
              isOutOfStock
                ? "text-muted-foreground"
                : "text-foreground group-hover:text-primary"
            }`}
          >
            {product.name}
          </h3>

          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-bold text-base md:text-lg ${
                isOutOfStock ? "text-muted-foreground" : "text-gold"
              }`}
            >
              ৳{displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground line-through text-xs md:text-sm">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
