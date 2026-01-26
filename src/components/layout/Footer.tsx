import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram } from "lucide-react";

const LOGO_URL = "https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png";

export function Footer() {
  return (
    <footer className="bg-secondary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <img 
                src={LOGO_URL} 
                alt="Unity Collection" 
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Premium Bangladeshi traditional clothing for men. 
              Elegant designs for Eid, Ramadan, and special occasions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-gold transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-sm hover:text-gold transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-sm hover:text-gold transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-gold transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gold" />
                <span>+880 1XXX-XXXXXX</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gold" />
                <span>info@unitycollection.com</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gold mt-0.5" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-gold transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-sidebar-border text-center">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} Unity Collection. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
