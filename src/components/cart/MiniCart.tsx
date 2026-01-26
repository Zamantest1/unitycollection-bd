import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag, ShoppingCart } from "lucide-react";

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { items, removeItem, subtotal, itemCount } = useCart();
  const navigate = useNavigate();

  const displayItems = items.slice(0, 3);
  const remainingCount = items.length - 3;

  const handleProceedToCheckout = () => {
    onClose();
    navigate("/cart");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50"
          onMouseEnter={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Your Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
            </h3>
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <div className="p-6 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="max-h-60 overflow-y-auto">
                {displayItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border-b border-border last:border-b-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-14 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      {item.size && (
                        <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-gold font-medium">
                          ৳{item.price} × {item.quantity}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {remainingCount > 0 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    and {remainingCount} more item{remainingCount > 1 ? "s" : ""}...
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-gold">৳{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Link to="/cart" className="flex-1" onClick={onClose}>
                    <Button variant="outline" className="w-full" size="sm">
                      View Cart
                    </Button>
                  </Link>
                  <Button 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
                    size="sm"
                    onClick={handleProceedToCheckout}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Checkout
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
