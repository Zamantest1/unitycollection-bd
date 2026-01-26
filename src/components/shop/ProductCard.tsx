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
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Discount Badge */}
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-gold text-gold-foreground">
              -{discountPercent}%
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-3 md:p-4">
          {/* Category */}
          {product.categories?.name && (
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              {product.categories.name}
            </p>
          )}

          {/* Name */}
          <h3 className="font-display font-semibold text-foreground text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-gold font-bold text-lg">
              ৳{displayPrice?.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-muted line-through text-sm">
                ৳{product.price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
