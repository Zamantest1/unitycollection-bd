import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { OrderForm } from "@/components/product/OrderForm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-muted rounded mb-6" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/4 bg-muted rounded" />
                <div className="h-24 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-4">
            Product Not Found
          </h1>
          <Link to="/shop">
            <Button className="bg-primary text-primary-foreground">
              Back to Shop
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasDiscount = product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;
  const displayPrice = hasDiscount ? product.discount_price : product.price;
  const images = product.image_urls?.length ? product.image_urls : ["/placeholder.svg"];
  const sizes = product.sizes || [];
  const stockQuantity = product.stock_quantity || 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Layout>
      <div className="bg-background min-h-screen">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-foreground">Shop</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>

        <div className="container mx-auto px-4 pb-12">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-card">
                <img
                  src={images[currentImage]}
                  alt={product.name}
                  className={`w-full h-full object-cover ${isOutOfStock ? "opacity-60" : ""}`}
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {hasDiscount && (
                    <Badge className="bg-gold text-gold-foreground text-sm px-3 py-1">
                      -{discountPercent}% OFF
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      Sold Out
                    </Badge>
                  )}
                </div>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors flex items-center justify-center"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors flex items-center justify-center"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden border-2 transition-colors ${
                        index === currentImage ? "border-gold" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {/* Category */}
              {product.categories?.name && (
                <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                  {product.categories.name}
                </p>
              )}

              {/* Name */}
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-gold font-bold text-2xl md:text-3xl">
                  ৳{displayPrice?.toLocaleString()}
                </span>
                {hasDiscount && (
                  <span className="text-muted-foreground line-through text-lg">
                    ৳{product.price.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-md">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-sm font-medium">Out of Stock</span>
                  </div>
                ) : isLowStock ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-700 rounded-md">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">Only {stockQuantity} left in stock</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-700 rounded-md">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">In Stock ({stockQuantity} available)</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-3">Select Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-md border-2 font-medium transition-colors ${
                          selectedSize === size
                            ? "border-primary bg-primary text-primary-foreground"
                            : isOutOfStock
                            ? "border-border opacity-50 cursor-not-allowed"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Form */}
              {isOutOfStock ? (
                <div className="border-t border-border pt-6">
                  <Button disabled className="w-full" size="lg">
                    Out of Stock
                  </Button>
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    This product is currently unavailable. Please check back later.
                  </p>
                </div>
              ) : (
                <OrderForm
                  product={{
                    id: product.id,
                    name: product.name,
                    price: displayPrice!,
                    size: selectedSize || undefined,
                    stockQuantity,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
