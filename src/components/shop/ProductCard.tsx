import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check, Eye } from "lucide-react";
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
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const imageUrl = product.image_urls?.[0] || "/placeholder.svg";
  const stockQuantity = product.stock_quantity ?? 0;
  const isOutOfStock = stockQuantity === 0;
  
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
      imageUrl,
      quantity: 1,
      stockQuantity,
      productCode: product.product_code,
    });

    setIsAdded(true);
    toast({
      title: "Added to cart!",
      description: `${product.name}${defaultSize ? ` (${defaultSize})` : ""} has been added`,
    });

    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="block group h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-xl hover:shadow-primary/10"
      >
        {/* Image with lazy loading and blur placeholder */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {/* Blur placeholder skeleton */}
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              isOutOfStock ? "opacity-60" : ""
            } ${imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/45 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && !isOutOfStock && (
              <Badge className="border-0 bg-gold text-gold-foreground shadow-md">
                -{discountPercent}%
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="shadow-md">
                Sold Out
              </Badge>
            )}
          </div>

          <div className="absolute left-3 right-3 top-3 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-medium text-foreground opacity-0 shadow-sm backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
              <Eye className="h-3 w-3" />
              View
            </span>
          </div>

          {/* Quick Add Button */}
          {!isOutOfStock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-3 right-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
            >
              <Button
                size="icon"
                onClick={handleQuickAdd}
                className={`h-10 w-10 rounded-full shadow-lg transition-all ${
                  isAdded 
                    ? "bg-green-500 hover:bg-green-600" 
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
          {/* Category */}
          {product.categories?.name && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold mb-1">
              {product.categories.name}
            </p>
          )}
          {product.product_code && (
            <p className="text-[10px] text-muted-foreground/70 font-mono mb-1.5">{product.product_code}</p>
          )}

          {/* Name */}
          <h3 className={`font-display font-semibold text-sm md:text-base line-clamp-2 transition-colors ${isOutOfStock ? "text-muted-foreground" : "text-foreground group-hover:text-primary"}`}>
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`font-bold text-lg ${isOutOfStock ? "text-muted-foreground" : "text-gold"}`}>
              ৳{displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground line-through text-sm">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>
          {!isOutOfStock && stockQuantity <= 3 && (
            <p className="mt-2 text-xs font-medium text-destructive">
              Only {stockQuantity} left
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
