import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link to="/cart">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-primary-foreground hover:text-gold hover:bg-primary/20"
      >
        <ShoppingCart className="h-5 w-5" />
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-gold text-gold-foreground text-xs font-bold"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </Link>
  );
}
