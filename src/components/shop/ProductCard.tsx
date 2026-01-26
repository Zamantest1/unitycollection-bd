import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  image_urls: string[];
  categories?: { name: string } | null;
  stock_quantity?: number;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;

  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const imageUrl = product.image_urls?.[0] || "/placeholder.svg";
  const stockQuantity = product.stock_quantity ?? 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        to={`/product/${product.id}`}
        className="block group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isOutOfStock ? "opacity-60" : ""}`}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && !isOutOfStock && (
              <Badge className="bg-gold text-gold-foreground">
                -{discountPercent}%
              </Badge>
            )}
            {isOutOfStock && (
              <Badge variant="destructive">
                Sold Out
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge className="bg-yellow-500/90 text-white">
                Only {stockQuantity} left
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 md:p-4">
          {/* Category */}
          {product.categories?.name && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {product.categories.name}
            </p>
          )}

          {/* Name */}
          <h3 className={`font-display font-semibold text-sm md:text-base line-clamp-2 transition-colors ${isOutOfStock ? "text-muted-foreground" : "text-foreground group-hover:text-primary"}`}>
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            <span className={`font-bold text-lg ${isOutOfStock ? "text-muted-foreground" : "text-gold"}`}>
              ৳{displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground line-through text-sm">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
