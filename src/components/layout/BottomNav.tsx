import { Link, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Truck, LayoutGrid } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface NavItem {
  label: string;
  icon: typeof Home;
  to: string;
  matches: (path: string) => boolean;
  badge?: number;
}

/**
 * Mobile bottom navigation — visible on screens < md.
 * 4 tabs: Home / Shop / Categories / Cart / Track.
 * The WhatsApp bubble lives separately as a floating action button
 * (see FloatingWhatsApp) so it never crowds the nav.
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
      matches: (p) => p === "/shop",
    },
    {
      label: "Categories",
      icon: LayoutGrid,
      to: "/categories",
      matches: (p) => p.startsWith("/categories"),
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
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className="flex h-full w-full"
              >
                {content}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
