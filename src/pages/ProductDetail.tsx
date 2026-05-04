import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { OrderForm } from "@/components/product/OrderForm";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as Chevron,
  X,
  Maximize2,
  Truck,
  ShieldCheck,
  Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { PaymentLogos } from "@/components/payment/PaymentLogos";

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image_urls: string[] | null;
  product_code: string;
  sizes: string[] | null;
  stock_quantity: number;
  categories: { name: string } | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: product, isLoading } = useQuery<ProductRow | null>({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id ?? "")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as ProductRow | null;
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
            Product not found
          </h1>
          <Link to="/shop">
            <Button className="rounded-full bg-gradient-gold-strong text-gold-foreground">
              Back to Shop
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const hasDiscount =
    !!product.discount_price && product.discount_price < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0;
  const displayPrice = hasDiscount ? product.discount_price! : product.price;
  const images = product.image_urls?.length ? product.image_urls : ["/placeholder.svg"];
  const sizes = product.sizes || [];
  const stockQuantity = product.stock_quantity || 0;
  const isOutOfStock = stockQuantity === 0;
  const isLastOne = stockQuantity === 1;
  const isLowStock = !isOutOfStock && stockQuantity > 0 && stockQuantity <= 3;

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <Layout>
      <div className="bg-background min-h-screen pb-24 md:pb-8">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-3 md:py-4">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground"
          >
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <Chevron className="h-3 w-3" />
            <Link to="/shop" className="hover:text-foreground">
              Shop
            </Link>
            <Chevron className="h-3 w-3" />
            <span className="text-foreground truncate max-w-[60vw] md:max-w-none">
              {product.name}
            </span>
          </nav>
        </div>

        <div className="container mx-auto px-4 pb-8">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start">
            {/* Image Gallery */}
            <div className="md:sticky md:top-24 space-y-3 md:space-y-4">
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="relative block w-full aspect-square rounded-2xl overflow-hidden bg-card ring-1 ring-gold/15 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                aria-label="Open image full-screen"
              >
                <img
                  src={images[currentImage]}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                    isOutOfStock ? "opacity-60" : ""
                  }`}
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  {hasDiscount && !isOutOfStock && (
                    <Badge className="bg-gold text-gold-foreground border-0 px-2.5 py-1 shadow-sm">
                      −{discountPercent}% OFF
                    </Badge>
                  )}
                  {isOutOfStock && (
                    <Badge variant="destructive" className="px-2.5 py-1 shadow-sm">
                      Sold Out
                    </Badge>
                  )}
                </div>

                {/* Zoom hint */}
                <span className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-card/80 backdrop-blur-sm shadow-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 className="h-4 w-4" />
                </span>

                {images.length > 1 && (
                  <>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors flex items-center justify-center cursor-pointer"
                      role="button"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm text-foreground hover:bg-card transition-colors flex items-center justify-center cursor-pointer"
                      role="button"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </span>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card/80 backdrop-blur-sm text-xs">
                      {currentImage + 1} / {images.length}
                    </div>
                  </>
                )}
              </button>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImage(index)}
                      className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden ring-2 transition ${
                        index === currentImage
                          ? "ring-gold"
                          : "ring-transparent hover:ring-gold/40"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {product.categories?.name && (
                <p className="text-[11px] md:text-xs text-gold uppercase tracking-[0.25em] mb-2 font-semibold">
                  {product.categories.name}
                </p>
              )}

              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                {product.name}
              </h1>
              {product.product_code && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Code: {product.product_code}
                </p>
              )}

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-gold font-bold text-2xl md:text-3xl">
                  ৳{displayPrice.toLocaleString()}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-muted-foreground line-through text-base md:text-lg">
                      ৳{product.price.toLocaleString()}
                    </span>
                    <Badge className="bg-gold/10 text-gold border-gold/30">
                      Save ৳{(product.price - displayPrice).toLocaleString()}
                    </Badge>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="mt-3">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-md">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-sm font-medium">Out of Stock</span>
                  </div>
                ) : isLastOne ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive rounded-md animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-destructive" />
                    <span className="text-sm font-medium">
                      Only 1 left — order soon
                    </span>
                  </div>
                ) : isLowStock ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 text-orange-700 rounded-md">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium">
                      Only {stockQuantity} left in stock
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-700 rounded-md">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">In stock</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="mt-6">
                  <h3 className="font-display font-semibold text-foreground mb-1.5">
                    Description
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Size Selector */}
              {sizes.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display font-semibold text-foreground">
                      Select size
                    </h3>
                    <Link
                      to="/contact"
                      className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                    >
                      Size guide
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        disabled={isOutOfStock}
                        className={`min-w-12 h-11 px-4 rounded-full border-2 font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                          selectedSize === size
                            ? "border-gold bg-gold text-gold-foreground shadow-sm"
                            : isOutOfStock
                              ? "border-border opacity-50 cursor-not-allowed"
                              : "border-border hover:border-gold"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart / Order Section — desktop+tablet */}
              <div className="mt-7 hidden md:block">
                {isOutOfStock ? (
                  <div className="border-t border-border pt-6">
                    <Button disabled className="w-full rounded-full" size="lg">
                      Sold out
                    </Button>
                    <p className="text-sm text-muted-foreground text-center mt-3">
                      This product is currently unavailable. Please check back later.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AddToCartButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: displayPrice,
                        originalPrice: product.price,
                        imageUrl: images[0],
                        stockQuantity,
                        productCode: product.product_code,
                      }}
                      selectedSize={selectedSize || undefined}
                      requiresSize={sizes.length > 0}
                      className="w-full h-12 rounded-full bg-gradient-gold-strong text-gold-foreground hover:opacity-95"
                      size="lg"
                    />

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or order directly
                        </span>
                      </div>
                    </div>

                    <OrderForm
                      product={{
                        id: product.id,
                        name: product.name,
                        price: displayPrice,
                        size: selectedSize || undefined,
                        stockQuantity,
                        productCode: product.product_code,
                        imageUrl: product.image_urls?.[0],
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Trust strip */}
              <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-gold/15 bg-card/60 p-3">
                <TrustItem icon={Truck} title="Fast" sub="Rajshahi 1–2 days" />
                <TrustItem icon={Banknote} title="Cash on" sub="Delivery" />
                <TrustItem icon={ShieldCheck} title="Easy" sub="Exchange" />
              </div>

              <div className="mt-4">
                <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider">
                  We accept
                </p>
                <PaymentLogos />
              </div>

              {/* Mobile-only: in-page Order form (sticky bar handles add-to-cart) */}
              <div className="mt-7 md:hidden">
                {!isOutOfStock && (
                  <OrderForm
                    product={{
                      id: product.id,
                      name: product.name,
                      price: displayPrice,
                      size: selectedSize || undefined,
                      stockQuantity,
                      productCode: product.product_code,
                      imageUrl: product.image_urls?.[0],
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile bottom buy bar */}
      {!isOutOfStock && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-card/95 backdrop-blur-md border-t border-gold/30 px-3 py-2.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">
                Total
              </p>
              <p className="font-display text-lg font-bold text-gold leading-tight">
                ৳{displayPrice.toLocaleString()}
              </p>
            </div>
            <div className="flex-1">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: displayPrice,
                  originalPrice: product.price,
                  imageUrl: images[0],
                  stockQuantity,
                  productCode: product.product_code,
                }}
                selectedSize={selectedSize || undefined}
                requiresSize={sizes.length > 0}
                className="w-full h-11 rounded-full bg-gradient-gold-strong text-gold-foreground"
                size="lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black border-0 [&_>button]:hidden">
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={images[currentImage]}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Previous"
                  className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Next"
                  className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-white text-xs">
                  {currentImage + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

function TrustItem({
  icon: Icon,
  title,
  sub,
}: {
  icon: typeof Truck;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-1 px-1">
      <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-gold">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </span>
      <p className="text-[11px] font-semibold text-foreground leading-none mt-1">
        {title}
      </p>
      <p className="text-[10px] text-muted-foreground leading-none">{sub}</p>
    </div>
  );
}

export default ProductDetail;
