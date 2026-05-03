import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, PhoneCall } from "lucide-react";
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
    <header className="sticky top-0 z-50 border-b border-primary-foreground/10 bg-secondary/95 shadow-sm backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo & Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src={LOGO_URL} 
              alt="Unity Collection" 
              className="h-10 md:h-14 w-auto transition-transform duration-300 group-hover:scale-105"
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
                className={`relative rounded-full px-1 py-2 font-medium transition-colors duration-200 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:-translate-x-1/2 after:rounded-full after:bg-gold after:transition-all ${
                  isActive(link.path)
                    ? "text-gold after:w-5"
                    : "text-primary-foreground hover:text-gold after:w-0 hover:after:w-5"
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
              asChild
              className="text-primary-foreground hover:text-gold hover:bg-primary/20"
            >
              <Link to="/shop" aria-label="Search products">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            <a
              href="tel:+8801880545357"
              className="hidden xl:inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 px-3 py-2 text-sm font-medium text-primary-foreground/85 transition-colors hover:border-gold/70 hover:text-gold"
            >
              <PhoneCall className="h-4 w-4" />
              +880 1880-545357
            </a>
            <CartIcon />
            <Link to="/shop">
              <Button className="bg-gold text-gold-foreground hover:bg-gold/90 font-semibold shadow-lg shadow-gold/20">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-1">
            <CartIcon />
            <button
              className="rounded-full p-2 text-primary-foreground transition-colors hover:bg-primary/20 hover:text-gold"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
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
            className="md:hidden border-t border-primary-foreground/10 bg-secondary/95 shadow-xl"
          >
            <nav className="container mx-auto px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/30 text-gold"
                      : "text-primary-foreground hover:bg-primary/20 hover:text-gold"
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
