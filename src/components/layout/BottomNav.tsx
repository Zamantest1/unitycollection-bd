import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Truck, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

const WHATSAPP_NUMBER = "8801880545357";

interface NavItem {
  label: string;
  icon: typeof Home;
  to?: string;
  href?: string;
  matches?: (path: string) => boolean;
  badge?: number;
  external?: boolean;
}

/**
 * Mobile bottom navigation — visible on screens < md.
 * 5 tabs: Home / Shop / Cart / Track / WhatsApp.
 * Replaces the floating WhatsApp bubble on mobile.
 */
export function BottomNav() {
  const location = useLocation();
  const { itemCount } = useCart();

  const items: NavItem[] = [
    {
      label: "Home",
      icon: Home,
      to: "/",
      matches: (p) => p === "/",
    },
    {
      label: "Shop",
      icon: Search,
      to: "/shop",
      matches: (p) => p === "/shop" || p.startsWith("/categories"),
    },
    {
      label: "Cart",
      icon: ShoppingBag,
      to: "/cart",
      matches: (p) => p === "/cart",
      badge: itemCount,
    },
    {
      label: "Track",
      icon: Truck,
      to: "/track",
      matches: (p) => p.startsWith("/track"),
    },
    {
      label: "Chat",
      icon: MessageCircle,
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      external: true,
    },
  ];

  return (
    <nav
      aria-label="Mobile primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-gradient-primary text-primary-foreground border-t border-sidebar-border shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.4)] pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.matches?.(location.pathname) ?? false;
          const content = (
            <span
              className={`flex flex-col items-center justify-center gap-0.5 h-full w-full text-[11px] transition-colors ${
                active ? "text-gold" : "text-primary-foreground/85 hover:text-gold"
              }`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {!!item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gold text-gold-foreground text-[10px] font-bold flex items-center justify-center">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </span>
              <span className="font-medium">{item.label}</span>
              {active && <span aria-hidden className="absolute top-0 h-0.5 w-8 bg-gold rounded-b-full" />}
            </span>
          );

          return (
            <li key={item.label} className="relative">
              {item.to ? (
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className="flex h-full w-full"
                >
                  {content}
                </Link>
              ) : (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${item.label} on WhatsApp`}
                  className="flex h-full w-full"
                >
                  {content}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
