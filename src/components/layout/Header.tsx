import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CartIcon } from "@/components/cart/CartIcon";

const LOGO_URL = "https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Shop", path: "/shop" },
  { name: "Categories", path: "/categories" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-secondary shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={LOGO_URL} 
              alt="Unity Collection" 
              className="h-10 md:h-14 w-auto"
            />
            <span className="md:hidden lg:block font-heading text-lg lg:text-xl font-semibold text-primary-foreground leading-tight tracking-wide">
              Unity Collection
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-gold"
                    : "text-primary-foreground hover:text-gold"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:text-gold hover:bg-primary/20"
            >
              <Search className="h-5 w-5" />
            </Button>
            <CartIcon />
            <Link to="/shop">
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90 font-medium">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-primary-foreground p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-secondary border-t border-sidebar-border"
          >
            <nav className="container mx-auto px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-gold"
                      : "text-primary-foreground hover:text-gold"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex gap-2 mt-4">
                <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Cart
                  </Button>
                </Link>
                <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop Now
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
