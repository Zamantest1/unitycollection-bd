import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    imageUrl: string;
    stockQuantity: number;
  };
  selectedSize?: string;
  requiresSize?: boolean;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AddToCartButton({
  product,
  selectedSize,
  requiresSize = false,
  className,
  variant = "default",
  size = "default",
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = () => {
    if (requiresSize && !selectedSize) {
      toast({
        title: "Select a size",
        description: "Please select a size before adding to cart",
        variant: "destructive",
      });
      return;
    }

    if (product.stockQuantity < 1) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    // Simulate a brief delay for UX feedback
    setTimeout(() => {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        size: selectedSize || "",
        imageUrl: product.imageUrl,
        quantity: 1,
        stockQuantity: product.stockQuantity,
      });

      setIsAdding(false);
      setJustAdded(true);

      toast({
        title: "Added to Cart",
        description: `${product.name}${selectedSize ? ` (Size: ${selectedSize})` : ""} has been added to your cart`,
      });

      setTimeout(() => setJustAdded(false), 2000);
    }, 300);
  };

  const isDisabled = product.stockQuantity < 1;

  return (
    <Button
      onClick={handleAddToCart}
      variant={variant}
      size={size}
      disabled={isDisabled || isAdding}
      className={cn(
        "transition-all duration-200",
        justAdded && "bg-green-600 hover:bg-green-700",
        className
      )}
    >
      {isAdding ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : justAdded ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      {isDisabled ? "Out of Stock" : justAdded ? "Added!" : "Add to Cart"}
    </Button>
  );
}
