import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { MiniCart } from "./MiniCart";
import { useIsMobile } from "@/hooks/use-mobile";

export function CartIcon() {
  const { itemCount } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!isMobile) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      timeoutRef.current = setTimeout(() => {
        setIsHovered(false);
      }, 150);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      navigate("/cart");
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link to="/cart" onClick={handleClick}>
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

      {/* Mini Cart Dropdown - Desktop only */}
      {!isMobile && (
        <MiniCart isOpen={isHovered} onClose={() => setIsHovered(false)} />
      )}
    </div>
  );
}
