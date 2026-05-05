import { useState, ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Image as ImageIcon,
  Tag,
  ShoppingCart,
  Bell,
  LogOut,
  Menu,
  ChevronLeft,
  Users,
  UserCheck,
  X,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InstallPrompt } from "./InstallPrompt";
import { useAdminAuth } from "./RequireAdmin";

const LOGO_URL =
  "https://res.cloudinary.com/dma4usxh0/image/upload/v1769446863/Unity_Collection_Logo_ophmui.png";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  group: "Overview" | "Catalog" | "Customers" | "Marketing" | "Payments";
}

const navItems: NavItem[] = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard, group: "Overview" },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart, group: "Overview" },
  { name: "Products", path: "/admin/products", icon: Package, group: "Catalog" },
  { name: "Categories", path: "/admin/categories", icon: FolderOpen, group: "Catalog" },
  { name: "Banners", path: "/admin/banners", icon: ImageIcon, group: "Catalog" },
  { name: "Members", path: "/admin/members", icon: UserCheck, group: "Customers" },
  { name: "Referrals", path: "/admin/referrals", icon: Users, group: "Customers" },
  { name: "Payments", path: "/admin/payments", icon: CreditCard, group: "Payments" },
  { name: "Payment Methods", path: "/admin/payment-methods", icon: CreditCard, group: "Payments" },
  { name: "Coupons", path: "/admin/coupons", icon: Tag, group: "Marketing" },
  { name: "Notice Bar", path: "/admin/notice", icon: Bell, group: "Marketing" },
  { name: "Storefront", path: "/admin/storefront", icon: Sparkles, group: "Marketing" },
];

const groups: NavItem["group"][] = [
  "Overview",
  "Catalog",
  "Customers",
  "Payments",
  "Marketing",
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { email: adminEmail, logout: handleLogout } = useAdminAuth();

  const adminInitial = (adminEmail[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F4EE] flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 bg-secondary border-r border-sidebar-border shadow-[8px_0_24px_-12px_rgba(11,58,52,0.25)] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="px-3 py-3 border-b border-sidebar-border flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-gold-strong shadow ring-2 ring-gold/40">
                <img
                  src={LOGO_URL}
                  alt="Unity Collection"
                  className="h-6 w-6 object-contain"
                />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[13px] font-bold text-sidebar-foreground leading-none">
                  Unity Collection
                </p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-gold leading-none mt-1">
                  Admin
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="lg:hidden text-sidebar-foreground hover:text-gold p-1"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto scrollbar-thin">
            {groups.map((g) => {
              const items = navItems.filter((i) => i.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g} className="space-y-0.5">
                  <p className="px-2.5 mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
                    {g}
                  </p>
                  {items.map((item) => {
                    const isActive =
                      item.path === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                          isActive
                            ? "bg-gradient-to-r from-gold/15 to-transparent text-gold"
                            : "text-sidebar-foreground/85 hover:bg-white/5 hover:text-gold",
                        )}
                      >
                        {isActive && (
                          <span
                            aria-hidden
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-r-full bg-gold"
                          />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Admin profile */}
          <div className="px-3 pt-2 pb-2 border-t border-sidebar-border">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-gold-strong text-gold-foreground font-semibold text-xs">
                {adminInitial}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-sidebar-foreground truncate">
                  {adminEmail || "Administrator"}
                </p>
                <p className="text-[9px] text-sidebar-foreground/60">Admin</p>
              </div>
            </div>
            <InstallPrompt />
            <Link to="/" className="block mt-1">
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2.5 text-[12px] text-sidebar-foreground hover:text-gold hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
                View store
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start h-8 px-2.5 text-[12px] text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border/60 px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hidden md:block">
              Unity Collection · Admin
            </p>
            <h1 className="font-display text-lg md:text-xl font-bold text-foreground leading-tight truncate">
              {title}
            </h1>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2">
            <Link to="/" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-gold/40 text-foreground hover:bg-gold/10"
              >
                View store
              </Button>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
