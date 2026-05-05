import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CartIcon } from "@/components/cart/CartIcon";
import { SearchCommand } from "./SearchCommand";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-gradient-primary shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-2.5 md:gap-3 group min-w-0">
            <img
              src={LOGO_URL}
              alt="Unity Collection"
              className="h-9 md:h-14 w-auto shrink-0"
            />
            <div className="leading-tight min-w-0">
              <span className="block font-display text-[15px] md:text-xl font-semibold text-primary-foreground tracking-wide group-hover:text-gold transition-colors truncate">
                Unity Collection
              </span>
              <span className="hidden md:block text-[10px] uppercase tracking-[0.18em] text-gold/90">
                For Men · Made in Bangladesh
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-7" aria-label="Primary">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                aria-current={isActive(link.path) ? "page" : undefined}
                className={`relative font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-gold"
                    : "text-primary-foreground hover:text-gold"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span aria-hidden className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold" />
                )}
              </Link>
            ))}
            <Link
              to="/track"
              aria-current={location.pathname.startsWith("/track") ? "page" : undefined}
              className={`flex items-center gap-1.5 font-medium transition-colors ${
                location.pathname.startsWith("/track")
                  ? "text-gold"
                  : "text-primary-foreground hover:text-gold"
              }`}
            >
              <Truck className="h-4 w-4" />
              Track Order
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search products"
              onClick={() => setSearchOpen(true)}
              className="text-primary-foreground hover:text-gold hover:bg-primary/30"
            >
              <Search className="h-5 w-5" />
            </Button>
            <CartIcon />
            <Link to="/shop">
              <Button className="bg-gradient-gold text-gold-foreground hover:opacity-95 font-medium shadow-md">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop Now
              </Button>
            </Link>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search products"
              onClick={() => setSearchOpen(true)}
              className="text-primary-foreground hover:text-gold hover:bg-primary/30"
            >
              <Search className="h-5 w-5" />
            </Button>
            <CartIcon />
            <button
              className="text-primary-foreground p-2 rounded hover:text-gold"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
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
            <nav className="container mx-auto px-4 py-4 space-y-3" aria-label="Mobile">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(link.path) ? "page" : undefined}
                  className={`block py-2 font-medium transition-colors ${
                    isActive(link.path)
                      ? "text-gold"
                      : "text-primary-foreground hover:text-gold"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-2 font-medium text-primary-foreground hover:text-gold"
              >
                <Truck className="h-4 w-4" />
                Track Order
              </Link>
              <div className="flex gap-2 pt-2">
                <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button variant="outline" className="w-full">
                    Cart
                  </Button>
                </Link>
                <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <Button className="w-full bg-gradient-gold text-gold-foreground hover:opacity-95">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Shop Now
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
