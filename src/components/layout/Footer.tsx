import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, Truck, MessageCircle, Banknote } from "lucide-react";

const LOGO_URL = "https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png";
const WHATSAPP_NUMBER = "8801880545357";

const paymentChips = [
  { label: "Cash on Delivery", icon: Banknote },
  { label: "bKash", emoji: "💗" },
  { label: "Nagad", emoji: "🟧" },
  { label: "Rocket", emoji: "🟪" },
];

export function Footer() {
  return (
    <footer className="bg-gradient-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="inline-block mb-3">
              <img
                src={LOGO_URL}
                alt="Unity Collection"
                className="h-14 w-auto"
              />
            </Link>
            <h3 className="font-display text-lg font-semibold text-gold mb-2">
              Unity Collection
            </h3>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold/90 mb-3">
              For Men · Made in Bangladesh
            </p>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Premium men&apos;s traditional wear, made in Bangladesh. Heritage-crafted Punjabi for Eid, Ramadan, and special occasions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-gold transition-colors">Home</Link></li>
              <li><Link to="/shop" className="hover:text-gold transition-colors">Shop</Link></li>
              <li><Link to="/categories" className="hover:text-gold transition-colors">Categories</Link></li>
              <li><Link to="/about" className="hover:text-gold transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
              <li>
                <Link to="/track" className="inline-flex items-center gap-1.5 hover:text-gold transition-colors">
                  <Truck className="h-3.5 w-3.5" />
                  Track Order
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-gold transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Order on WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gold" />
                <a href="tel:+8801880545357" className="hover:text-gold transition-colors">
                  +880 1880-545357
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gold" />
                <a href="mailto:unitycollectionbd@gmail.com" className="hover:text-gold transition-colors">
                  unitycollectionbd@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gold mt-0.5" />
                <span>Rajshahi, Bangladesh</span>
              </li>
            </ul>
          </div>

          {/* Social + Payments */}
          <div>
            <h4 className="font-display text-lg font-semibold text-gold mb-4">Follow Us</h4>
            <div className="flex gap-3 mb-6">
              <a
                href="https://www.facebook.com/UnityCollectionBd"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/40 flex items-center justify-center hover:bg-gold hover:text-gold-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.instagram.com/unitycollectionbd"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/40 flex items-center justify-center hover:bg-gold hover:text-gold-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary/40 flex items-center justify-center hover:bg-gold hover:text-gold-foreground transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>

            <h4 className="font-display text-sm font-semibold text-gold mb-3 uppercase tracking-wider">We Accept</h4>
            <div className="flex flex-wrap gap-2">
              {paymentChips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/40 border border-gold/20 text-[11px] font-medium"
                >
                  {"icon" in chip && chip.icon ? (
                    <chip.icon className="h-3.5 w-3.5 text-gold" />
                  ) : (
                    <span aria-hidden>{chip.emoji}</span>
                  )}
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-sidebar-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-sm text-primary-foreground/70">
              © {new Date().getFullYear()} Unity Collection. All rights reserved.
            </p>
            <p className="text-sm text-primary-foreground/70">
              Designed by{" "}
              <a
                href="https://shomikujzaman.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:underline"
              >
                Shomik Ujzaman
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
